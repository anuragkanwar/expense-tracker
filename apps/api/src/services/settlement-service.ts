import type {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
} from "@pocket-pixie/contracts";
import { BadRequestError } from "@/errors/base-error";
import { SettlementRepository } from "@/repositories/settlement-repository";
import {
  TransactionRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
} from "@/repositories";
import { ACCOUNT_TYPE, EXPENSE_SHARE_STATUS, type DBType } from "@/db";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { TransactionHelperService } from "./transaction-helper-service";
import { ExpenseShareRepository } from "@/repositories/expense-share-repository";
import { BalanceAdjustmentService } from "./balance-adjustment-service";
import {
  SettlementApplicationRepository,
  type SettlementApplicationResponse,
} from "@/repositories/settlement-application-repository";
import { BalanceRepository } from "@/repositories/balance-repository";
import { IdempotencyKeyConflictError } from "@/errors/idempotency-errors";

interface ExpenseShareSettlementResult {
  settlement: SettlementResponse;
  applications: SettlementApplicationResponse[];
  totalApplied: number;
  outstandingBefore: number;
  outstandingAfter: number;
}

export class SettlementService {
  private readonly settlementRepository;
  private readonly transactionRepository;
  private readonly transactionEntryRepository;
  private readonly transactionAccountRepository;
  private readonly transactionHelperService;
  private readonly expenseShareRepository: ExpenseShareRepository;
  private readonly settlementApplicationRepository: SettlementApplicationRepository;

  private readonly balanceAdjustmentService: BalanceAdjustmentService;
  private readonly db: DBType;

  constructor({
    settlementRepository,
    transactionRepository,
    transactionEntryRepository,
    transactionAccountRepository,
    transactionHelperService,
    expenseShareRepository,
    settlementApplicationRepository,

    db,
    balanceAdjustmentService,
  }: {
    settlementRepository: SettlementRepository;
    transactionRepository: TransactionRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionHelperService: TransactionHelperService;
    expenseShareRepository: ExpenseShareRepository;
    settlementApplicationRepository: SettlementApplicationRepository;
    balanceRepository: BalanceRepository;
    balanceAdjustmentService: BalanceAdjustmentService;
    db: DBType;
  }) {
    this.settlementRepository = settlementRepository;
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionHelperService = transactionHelperService;
    this.expenseShareRepository = expenseShareRepository;
    this.settlementApplicationRepository = settlementApplicationRepository;

    this.db = db;
    this.balanceAdjustmentService = balanceAdjustmentService;
  }

  // =============================================================
  // Basic CRUD (update & delete potentially useful for admin ops)
  // =============================================================
  async getAllSettlements(
    limit: number = 10,
    offset: number = 0
  ): Promise<SettlementResponse[]> {
    return this.settlementRepository.findAll(limit, offset);
  }

  async getSettlementById(id: string): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    return this.settlementRepository.findById(numericId);
  }

  async getSettlementsByGroupId(
    groupId: number
  ): Promise<SettlementResponse[]> {
    if (!groupId || typeof groupId !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    return this.settlementRepository.findByGroupId(groupId);
  }

  async updateSettlement(
    id: string,
    data: SettlementUpdate
  ): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      return null;
    }

    return this.settlementRepository.update(numericId, data);
  }

  async deleteSettlement(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      throw new BadRequestError("Settlement not found");
    }

    return this.settlementRepository.delete(numericId);
  }

  // (Legacy direct settlement endpoint removed)

  /**
   * Allocate a settlement amount against outstanding expense shares between two users (FIFO)
   * Canonical semantics:
   *  - payerId: user making the settlement payment (the debtor / participant paying back)
   *  - payeeId: user receiving the settlement (the original expense payer)
   * Algorithm:
   *  1. Fetch allocatable shares (participant = payerId, payer = payeeId) ordered FIFO
   *  2. Validate requested amount <= total outstanding
   *  3. Create settlement record
   *  4. Iterate shares updating paidAmount & status, inserting settlement_application rows
   *  5. Adjust user_balance rows to reduce the debt (owner=payeeId should decrease amount owed by payer)
   */
  async allocateExpenseShareSettlement(params: {
    payerId: number; // paying user (participant)
    payeeId: number; // receiving user (original payer)
    amount: number;
    currency: string;
    groupId?: number | null;
    idempotencyKey?: string | null;
  }): Promise<ExpenseShareSettlementResult> {
    const { payerId, payeeId, amount, currency, groupId, idempotencyKey } =
      params;

    if (payerId === payeeId) {
      throw new BadRequestError("Cannot settle with self");
    }
    if (amount <= 0) {
      throw new BadRequestError("Settlement amount must be positive");
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. Fetch allocatable shares
      const shares = await this.expenseShareRepository.findAllocatableShares(
        payerId,
        payeeId,
        currency,
        groupId ?? null,
        tx
      );
      if (!shares.length) {
        throw new BadRequestError("No outstanding shares to settle");
      }

      const outstandingBefore = shares.reduce(
        (acc, s) => acc + (s.amount - s.paidAmount),
        0
      );
      if (amount > outstandingBefore + 1e-8) {
        throw new BadRequestError(
          `Settlement amount ${amount} exceeds outstanding ${outstandingBefore}`
        );
      }

      // Idempotency check (if key provided)
      // Enhanced semantics: if key exists and payload differs -> conflict
      // We compare critical fields (payerId, payeeId, amount, currency, groupId)
      // NOTE: At this layer groupId null vs undefined treated equivalently

      if (idempotencyKey) {
        const existing = await this.settlementRepository.findByIdempotencyKey(
          idempotencyKey,
          tx
        );
        if (existing) {
          // Replay semantics: verify payload matches; if differs -> conflict
          const diffs: Record<
            string,
            { original: unknown; attempted: unknown }
          > = {};
          if (existing.payerId !== payerId)
            diffs.payerId = { original: existing.payerId, attempted: payerId };
          if (existing.payeeId !== payeeId)
            diffs.payeeId = { original: existing.payeeId, attempted: payeeId };
          if (Math.abs(existing.amount - amount) > 1e-8)
            diffs.amount = { original: existing.amount, attempted: amount };
          if (existing.currency !== currency)
            diffs.currency = {
              original: existing.currency,
              attempted: currency,
            };
          const existingGroup = existing.groupId ?? null;
          const attemptedGroup = groupId ?? null;
          if (existingGroup !== attemptedGroup)
            diffs.groupId = {
              original: existingGroup,
              attempted: attemptedGroup,
            };
          if (Object.keys(diffs).length) {
            throw new IdempotencyKeyConflictError(
              "Idempotency-Key reuse with differing payload",
              diffs
            );
          }
          // Replay: return previous allocation context (applications fetch)
          const applications =
            await this.settlementApplicationRepository.findBySettlementId(
              existing.id,
              tx
            );
          // Recompute outstandingBefore/after from shares and apps
          const appliedSum = applications.reduce(
            (acc, a) => acc + a.appliedAmount,
            0
          );
          const outstandingBefore = shares.reduce(
            (acc, s) => acc + (s.amount - s.paidAmount),
            0
          );
          return {
            settlement: existing,
            applications,
            totalApplied: appliedSum,
            outstandingBefore: outstandingBefore + appliedSum, // approximate prior before
            outstandingAfter: outstandingBefore,
          } satisfies ExpenseShareSettlementResult;
        }
      }

      // 2. Create settlement ledger transaction (loan reversal)
      const payerLoanTakenAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          payerId,
          ACCOUNT_TYPE.LOAN_TAKEN
        );
      const payeeLoanGivenAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          payeeId,
          ACCOUNT_TYPE.LOAN_GIVEN
        );
      if (!payerLoanTakenAcc) {
        throw new TransactionAccountNotFoundError(
          `${payerId} LOAN_TAKEN account`
        );
      }
      if (!payeeLoanGivenAcc) {
        throw new TransactionAccountNotFoundError(
          `${payeeId} LOAN_GIVEN account`
        );
      }

      const txn = await this.transactionRepository.create(
        {
          description: `Settlement allocation: ${payerId} -> ${payeeId}`,
          userId: payerId,
        },
        tx
      );

      // Post double-entry reversing debt for full applied amount (final amount may be less if partial outstanding)
      if (amount > 0) {
        await this.transactionHelperService.updateAccountsAndCreateEntries(
          [
            {
              srcAcc: payerLoanTakenAcc,
              dstAcc: payeeLoanGivenAcc,
              amount,
              txnId: txn.id,
            },
          ],
          tx
        );
      }

      const settlement = await this.settlementRepository.create(
        {
          payerId,
          payeeId,
          amount,
          currency,
          groupId: groupId ?? undefined,
          settledAt: new Date().toISOString(),
          transactionId: txn.id,
          idempotencyKey: idempotencyKey ?? undefined,
        } satisfies SettlementCreate,
        tx
      );

      // 3. Allocate FIFO
      let remaining = amount;
      const applications: SettlementApplicationResponse[] = [];
      for (const share of shares) {
        if (remaining <= 0) break;
        const shareRemaining = share.amount - share.paidAmount;
        if (shareRemaining <= 0) continue;
        const apply = Math.min(shareRemaining, remaining);
        const newPaid = share.paidAmount + apply;
        const newStatus =
          Math.abs(newPaid - share.amount) < 1e-8
            ? EXPENSE_SHARE_STATUS.PAID
            : EXPENSE_SHARE_STATUS.PARTIALLY_PAID;

        await this.expenseShareRepository.updateSharePayment(
          share.id,
          newPaid,
          newStatus,
          tx
        );

        const app = await this.settlementApplicationRepository.create(
          {
            settlementId: settlement.id,
            expenseShareId: share.id,
            appliedAmount: apply,
          },
          tx
        );
        applications.push(app);
        remaining -= apply;
      }

      const totalApplied = amount - remaining;
      const outstandingAfter = outstandingBefore - totalApplied;

      // 4. Adjust user_balance canonical direction
      // Apply negative delta to reduce debtor's obligation by totalApplied
      await this.balanceAdjustmentService.applyBilateralDelta(
        payeeId,
        payerId,
        -totalApplied,
        currency,
        groupId ?? null,
        tx
      );

      return {
        settlement,
        applications,
        totalApplied,
        outstandingBefore,
        outstandingAfter,
      } satisfies ExpenseShareSettlementResult;
    });

    return result;
  }
}

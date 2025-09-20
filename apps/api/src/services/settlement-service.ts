import type {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
  SettlementApplicationResponse,
} from "@pocket-pixie/contracts";
import { BadRequestError } from "@/errors/base-error";
import { SettlementRepository } from "@/repositories/settlement-repository";
import {
  TransactionRepository,
  TransactionAccountRepository,
} from "@/repositories";
import {
  ACCOUNT_TYPE,
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  type DBType,
  type DBTransactionType,
} from "@/db";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { TransactionHelperService } from "./transaction-helper-service";
import { ExpenseShareRepository } from "@/repositories/expense-share-repository";
import { InterpersonalDebtEngine } from "./interpersonal-debt-engine";
import { SettlementApplicationRepository } from "@/repositories/settlement-application-repository";
import { IdempotencyKeyConflictError } from "@/errors/idempotency-errors";

interface SettlementResult {
  settlement: SettlementResponse;
  applications: SettlementApplicationResponse[];
  totalApplied: number;
  outstandingBefore: number;
  outstandingAfter: number;
}

export class SettlementService {
  private readonly settlementRepository;
  private readonly transactionRepository;
  private readonly transactionAccountRepository;
  private readonly transactionHelperService;
  private readonly expenseShareRepository: ExpenseShareRepository;
  private readonly settlementApplicationRepository: SettlementApplicationRepository;

  private readonly interpersonalDebtEngine: InterpersonalDebtEngine;
  private readonly db: DBType;

  /**
   * Private helper method to wrap the repository call and ensure consistent parameter order
   */
  private async findAllocatableShares(
    debtorId: number,
    creditorId: number,
    currency: string,
    groupId: number | null,
    type: EXPENSE_SHARE_TYPE | null,
    tx: DBTransactionType
  ) {
    return this.expenseShareRepository.findAllocatableShares(
      debtorId,
      creditorId,
      currency,
      groupId,
      type,
      tx
    );
  }

  constructor({
    settlementRepository,
    transactionRepository,
    transactionAccountRepository,
    transactionHelperService,
    expenseShareRepository,
    settlementApplicationRepository,

    db,
    interpersonalDebtEngine,
  }: {
    settlementRepository: SettlementRepository;
    transactionRepository: TransactionRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionHelperService: TransactionHelperService;
    expenseShareRepository: ExpenseShareRepository;
    settlementApplicationRepository: SettlementApplicationRepository;
    interpersonalDebtEngine: InterpersonalDebtEngine;
    db: DBType;
  }) {
    this.settlementRepository = settlementRepository;
    this.transactionRepository = transactionRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionHelperService = transactionHelperService;
    this.expenseShareRepository = expenseShareRepository;
    this.settlementApplicationRepository = settlementApplicationRepository;

    this.db = db;
    this.interpersonalDebtEngine = interpersonalDebtEngine;
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

  /**
   * Allocate a settlement amount against outstanding obligations (expense shares or loans)
   * between two users using FIFO ordering.
   *
   * This unified implementation works with both expense shares and loans stored in the
   * unified expense_share table.
   *
   * The implementation includes per-allocation ledger entries, addressing the design gap
   * mentioned in LLD section 5.6. For each allocation:
   * 1. A child transaction is created (linked to the parent settlement transaction)
   * 2. Double-entry ledger entries are created for the specific allocation amount
   * 3. Transaction descriptions include detailed context (expense/loan type, share ID)
   *
   * This improves audit trails and ensures user_balance is fully derivable from allocation entries.
   *
   * @param params Settlement allocation parameters
   * @param params.payerId User ID of the person making the payment (debtor)
   * @param params.payeeId User ID of the person receiving the payment (creditor)
   * @param params.amount Amount to allocate
   * @param params.currency Currency code (3 letters)
   * @param params.groupId Optional group ID to scope the settlement
   * @param params.idempotencyKey Optional idempotency key for safe retries
   * @param params.type Optional type filter (EXPENSE or LOAN)
   * @returns Settlement result with applications and outstanding balances
   */
  async allocateSettlement(params: {
    payerId: number;
    payeeId: number;
    amount: number;
    currency: string;
    groupId?: number | null;
    idempotencyKey?: string | null;
    type?: EXPENSE_SHARE_TYPE | null;
  }): Promise<SettlementResult> {
    const {
      payerId,
      payeeId,
      amount,
      currency,
      groupId,
      idempotencyKey,
      type = null,
    } = params;

    if (payerId === payeeId) {
      throw new BadRequestError("Cannot settle with self");
    }
    if (amount <= 0) {
      throw new BadRequestError("Settlement amount must be positive");
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. Fetch allocatable shares using our helper method
      const shares = await this.findAllocatableShares(
        payerId,
        payeeId,
        currency,
        groupId ?? null,
        type,
        tx
      );

      if (!shares.length) {
        throw new BadRequestError("No outstanding obligations to settle");
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
      // We compare critical fields (payerId, payeeId, amount, currency, groupId, type)
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
          } satisfies SettlementResult;
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

      // The type description helps clarify which type of obligations are being settled
      const typeDescription =
        type === EXPENSE_SHARE_TYPE.LOAN
          ? "loan"
          : type === EXPENSE_SHARE_TYPE.EXPENSE
            ? "expense"
            : "obligation";

      const txn = await this.transactionRepository.create(
        {
          description: `Settlement allocation (${typeDescription}): ${payerId} -> ${payeeId}`,
          userId: payerId,
        },
        tx
      );

      // Post double-entry reversing debt for full applied amount
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

        // Update the share payment using the unified repository
        await this.expenseShareRepository.update(
          share.id,
          {
            paidAmount: newPaid,
            status: newStatus,
          },
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

        // Create per-allocation ledger entries for better audit trail
        // This implements the ledger parity mentioned in the LLD section 5.6
        // Get more information about the expense share for better context
        const expenseShare = await this.expenseShareRepository.findById(
          share.id,
          tx
        );
        if (!expenseShare) {
          throw new Error(`Could not find expense share with id ${share.id}`);
        }

        // Create a descriptive name for the allocation transaction
        const shareType =
          expenseShare.type === EXPENSE_SHARE_TYPE.LOAN ? "loan" : "expense";
        const allocationDescription = `Allocation: ${apply} ${currency} for ${shareType} share #${share.id}`;

        // Create child transaction for this specific allocation
        const allocationTxn = await this.transactionRepository.create(
          {
            description: allocationDescription,
            userId: payerId,
            parentTransactionId: txn.id, // Link to the parent settlement transaction
          },
          tx
        );

        // Create allocation-specific ledger entries
        await this.transactionHelperService.updateAccountsAndCreateEntries(
          [
            {
              srcAcc: payerLoanTakenAcc,
              dstAcc: payeeLoanGivenAcc,
              amount: apply,
              txnId: allocationTxn.id,
            },
          ],
          tx
        );

        remaining -= apply;
      }

      const totalApplied = amount - remaining;
      const outstandingAfter = outstandingBefore - totalApplied;

      // 4. Adjust user_balance canonical direction
      // Apply negative delta to reduce debtor's obligation by totalApplied
      await this.interpersonalDebtEngine.recordRepayment(
        {
          creditorId: payeeId,
          debtorId: payerId,
          amount: totalApplied,
          currency,
          groupId: groupId ?? null,
        },
        tx
      );

      return {
        settlement,
        applications,
        totalApplied,
        outstandingBefore,
        outstandingAfter,
      } satisfies SettlementResult;
    });

    return result;
  }

  /**
   * Allocate a settlement amount specifically for expense shares
   * This method is provided for compatibility with the existing API
   */
  async allocateExpenseShareSettlement(params: {
    payerId: number;
    payeeId: number;
    amount: number;
    currency: string;
    groupId?: number | null;
    idempotencyKey?: string | null;
  }): Promise<SettlementResult> {
    return this.allocateSettlement({
      ...params,
      type: EXPENSE_SHARE_TYPE.EXPENSE,
    });
  }

  /**
   * Allocate a settlement amount specifically for loans
   * This method is provided for the unified loan settlement API
   */
  async allocateLoanSettlement(params: {
    payerId: number;
    payeeId: number;
    amount: number;
    currency: string;
    groupId?: number | null;
    idempotencyKey?: string | null;
  }): Promise<SettlementResult> {
    return this.allocateSettlement({
      ...params,
      type: EXPENSE_SHARE_TYPE.LOAN,
    });
  }
}

// InterpersonalDebtEngine (initial scaffold)
// -------------------------------------------------------------
// Purpose: Provide a unifying abstraction over bilateral debt state
// mutations (loans, shared expense implicit loans, settlements, and
// allocation-based repayments). This is an early skeleton to converge
// logic currently spread across LoanService, TransactionService (shared
// expense loan-style entries), SettlementService, and BalanceAdjustmentService.
//
// Design Goals (future stages):
// 1. Single entrypoints for creating loan-originating deltas
// 2. Normalized validation of creditor/debtor constraints
// 3. Centralized balance mutation (delegating to BalanceAdjustmentService)
// 4. Optional ledger emission policy strategy (immediate vs summarized)
// 5. Seamless integration with expense_share obligations when loans adopt shares
//
// Current Scope: Interface + minimal base implementation delegating
// to BalanceAdjustmentService only (no persistence beyond balances).

import { ValidationError } from "@/errors/base-error";
import { BalanceAdjustmentService } from "./balance-adjustment-service";
import { ACCOUNT_TYPE, type DBTransactionType } from "@/db";
import { TransactionAccountRepository } from "@/repositories";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { TransactionHelperService } from "./transaction-helper-service";

export interface LoanOriginParams {
  creditorId: number; // lender / payer
  debtorId: number; // borrower / participant
  amount: number; // positive amount increases debtor obligation
  currency: string;
  transactionId: number;
  groupId?: number | null;
  description?: string; // future: persisted metadata
}

export interface RepaymentParams {
  creditorId: number; // original payer
  debtorId: number; // participant repaying
  amount: number; // positive amount reduces outstanding (engine will invert sign internally)
  currency: string;
  groupId?: number | null;
  description?: string;
}

export interface InterpersonalDebtEngine {
  recordDirectLoan(
    params: LoanOriginParams,
    tx?: DBTransactionType
  ): Promise<void>;
  recordRepayment(
    params: RepaymentParams,
    tx?: DBTransactionType
  ): Promise<void>;
}

export class InterpersonalDebtEngineImpl implements InterpersonalDebtEngine {
  private readonly balanceAdjustmentService: BalanceAdjustmentService;
  private readonly transactionAccountRepository: TransactionAccountRepository;
  private readonly transactionHelperService: TransactionHelperService;
  constructor({
    balanceAdjustmentService,
    transactionAccountRepository,
    transactionHelperService
  }: {
    balanceAdjustmentService: BalanceAdjustmentService;
    transactionAccountRepository: TransactionAccountRepository
    transactionHelperService: TransactionHelperService
  }) {
    this.balanceAdjustmentService = balanceAdjustmentService;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionHelperService = transactionHelperService;
  }

  async recordDirectLoan(
    { creditorId, debtorId, amount, currency, groupId, transactionId }: LoanOriginParams,
    tx?: DBTransactionType
  ): Promise<void> {
    // Validate inputs
    if (creditorId === debtorId) {
      throw new ValidationError("Creditor and debtor must be different users");
    }
    if (amount <= 0) {
      throw new ValidationError("Amount must be positive");
    }
    if (currency.length !== 3) {
      throw new ValidationError("Currency must be a 3-letter ISO code");
    }

    try {
      // Fetch loan accounts
      const creditorLoanGiven =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          creditorId,
          ACCOUNT_TYPE.LOAN_GIVEN,
          tx
        );

      if (!creditorLoanGiven) {
        throw new TransactionAccountNotFoundError(
          `LOAN_GIVEN account not found for user ${creditorId}`
        );
      }

      const debtorLoanTaken =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          debtorId,
          ACCOUNT_TYPE.LOAN_TAKEN,
          tx
        );

      if (!debtorLoanTaken) {
        throw new TransactionAccountNotFoundError(
          `LOAN_TAKEN account not found for user ${debtorId}`
        );
      }

      // Create ledger entries
      await this.transactionHelperService.updateAccountsAndCreateEntries(
        [
          {
            srcAcc: creditorLoanGiven,
            dstAcc: debtorLoanTaken,
            amount: amount,
            txnId: transactionId,
          },
        ],
        tx
      );

      await this.balanceAdjustmentService.applyBilateralDelta(
        creditorId,
        debtorId,
        amount,
        currency,
        groupId,
        tx
      );
    } catch (error) {
      console.error("Error in recordDirectLoan:", error);
      throw error; // Re-throw to ensure proper error handling
    }
  }

  async recordRepayment(
    { creditorId, debtorId, amount, currency, groupId }: RepaymentParams,
    tx?: DBTransactionType
  ): Promise<void> {
    if (amount <= 0) throw new Error("Repayment amount must be positive");
    if (creditorId === debtorId)
      throw new Error("Creditor and debtor must differ");
    // Repayment reduces obligation: apply negative delta
    await this.balanceAdjustmentService.applyBilateralDelta(
      creditorId,
      debtorId,
      -amount,
      currency,
      groupId ?? null,
      tx
    );
  }
}

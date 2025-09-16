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

import { BalanceAdjustmentService } from "./balance-adjustment-service";
import type { DBTransactionType } from "@/db";

export interface LoanOriginParams {
  creditorId: number; // lender / payer
  debtorId: number; // borrower / participant
  amount: number; // positive amount increases debtor obligation
  currency: string;
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

  constructor({
    balanceAdjustmentService,
  }: {
    balanceAdjustmentService: BalanceAdjustmentService;
  }) {
    this.balanceAdjustmentService = balanceAdjustmentService;
  }

  async recordDirectLoan(
    { creditorId, debtorId, amount, currency, groupId }: LoanOriginParams,
    tx?: DBTransactionType
  ): Promise<void> {
    if (amount <= 0) throw new Error("Loan amount must be positive");
    if (creditorId === debtorId)
      throw new Error("Creditor and debtor must differ");

    try {
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

// Registration Guidance (future):
// container.register({ interpersonalDebtEngine: asClass(InterpersonalDebtEngineImpl, { lifetime: Lifetime.SCOPED }).inject(
//   () => ({ balanceAdjustmentService: container.resolve("balanceAdjustmentService") })
// )});

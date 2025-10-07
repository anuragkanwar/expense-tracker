import { describe, it, expect, vi, beforeEach } from "vitest";
import { InterpersonalDebtEngineImpl } from "./interpersonal-debt-engine";

// Reuse documented sign convention from BalanceAdjustmentService:
// applyBilateralDelta(creditorId, debtorId, +amount) =>
//   creditor row +amount (owner=creditor, counterParty=debtor)
//   debtor row   -amount (owner=debtor, counterParty=creditor)
// Passing negative amount reduces outstanding symmetrically.

describe("InterpersonalDebtEngineImpl", () => {
  const creditorId = 101; // lender / original payer
  const debtorId = 202; // borrower / participant
  const currency = "USD";

  let engine: InterpersonalDebtEngineImpl;
  const mockBalanceAdjustmentService = {
    applyBilateralDelta: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new InterpersonalDebtEngineImpl({
      balanceAdjustmentService: mockBalanceAdjustmentService,
    });
  });

  describe("recordDirectLoan", () => {
    it("applies positive bilateral delta (overall context)", async () => {
      await engine.recordDirectLoan({
        creditorId,
        debtorId,
        amount: 250,
        currency,
        groupId: null,
      });

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledTimes(1);
      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledWith(
        creditorId,
        debtorId,
        250,
        currency,
        null,
        undefined
      );
    });

    it("applies positive bilateral delta (group context)", async () => {
      await engine.recordDirectLoan({
        creditorId,
        debtorId,
        amount: 99.99,
        currency: "INR",
        groupId: 777,
      });

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledWith(
        creditorId,
        debtorId,
        99.99,
        "INR",
        777,
        undefined
      );
    });

    it("rejects non-positive amount", async () => {
      await expect(
        engine.recordDirectLoan({
          creditorId,
          debtorId,
          amount: 0,
          currency,
        })
      ).rejects.toThrow(/must be positive/i);

      await expect(
        engine.recordDirectLoan({
          creditorId,
          debtorId,
          amount: -10,
          currency,
        })
      ).rejects.toThrow(/must be positive/i);

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).not.toHaveBeenCalled();
    });

    it("rejects identical creditor and debtor", async () => {
      await expect(
        engine.recordDirectLoan({
          creditorId: 5,
          debtorId: 5,
          amount: 1,
          currency,
        })
      ).rejects.toThrow(/must differ/i);
    });
  });

  describe("recordRepayment", () => {
    it("applies negative bilateral delta (overall context)", async () => {
      await engine.recordRepayment({
        creditorId,
        debtorId,
        amount: 40,
        currency,
        groupId: null,
      });

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledWith(
        creditorId,
        debtorId,
        -40,
        currency,
        null,
        undefined
      );
    });

    it("applies negative bilateral delta (group context)", async () => {
      await engine.recordRepayment({
        creditorId,
        debtorId,
        amount: 12.5,
        currency: "EUR",
        groupId: 404,
      });

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledWith(
        creditorId,
        debtorId,
        -12.5,
        "EUR",
        404,
        undefined
      );
    });

    it("rejects non-positive repayment amount", async () => {
      await expect(
        engine.recordRepayment({
          creditorId,
          debtorId,
          amount: 0,
          currency,
        })
      ).rejects.toThrow(/must be positive/i);

      await expect(
        engine.recordRepayment({
          creditorId,
          debtorId,
          amount: -1,
          currency,
        })
      ).rejects.toThrow(/must be positive/i);

      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).not.toHaveBeenCalled();
    });

    it("rejects identical creditor and debtor for repayment", async () => {
      await expect(
        engine.recordRepayment({
          creditorId: 9,
          debtorId: 9,
          amount: 5,
          currency,
        })
      ).rejects.toThrow(/must differ/i);
    });
  });

  // Invariant regression style test to ensure sign convention adherence
  it("(regression) ensures repayment always calls engine with negative delta", async () => {
    await engine.recordRepayment({
      creditorId,
      debtorId,
      amount: 123.45,
      currency,
    });
    const call =
      mockBalanceAdjustmentService.applyBilateralDelta.mock.calls.at(-1);
    expect(call[2]).toBe(-123.45); // amount argument
  });

  describe("Shared expense and loan interaction", () => {
    it("handles both loans and shared expenses using the same debt recording mechanism", async () => {
      // Arrange
      const payerId = creditorId; // payer = creditor
      const participantId = debtorId; // participant = debtor
      const loanAmount = 200;
      const expenseShareAmount = 75;

      // Act - record a direct loan
      await engine.recordDirectLoan({
        creditorId: payerId,
        debtorId: participantId,
        amount: loanAmount,
        currency,
      });

      // Then record a shared expense (same direction as a loan)
      await engine.recordDirectLoan({
        creditorId: payerId,
        debtorId: participantId,
        amount: expenseShareAmount,
        currency,
      });

      // Assert - verify balance adjustments were called consistently with positive amounts
      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenCalledTimes(2);

      // First call for loan
      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenNthCalledWith(
        1,
        payerId,
        participantId,
        loanAmount,
        currency,
        null,
        undefined
      );

      // Second call for shared expense
      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenNthCalledWith(
        2,
        payerId,
        participantId,
        expenseShareAmount,
        currency,
        null,
        undefined
      );

      // Now simulate a repayment that settles both the loan and expense share
      await engine.recordRepayment({
        creditorId: payerId,
        debtorId: participantId,
        amount: loanAmount + expenseShareAmount,
        currency,
      });

      // Verify the repayment uses negative amount
      expect(
        mockBalanceAdjustmentService.applyBilateralDelta
      ).toHaveBeenNthCalledWith(
        3,
        payerId,
        participantId,
        -(loanAmount + expenseShareAmount),
        currency,
        null,
        undefined
      );
    });
  });
});

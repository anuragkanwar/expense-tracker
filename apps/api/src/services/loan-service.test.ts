import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "./loan-service";

// Local enum replicas (avoid path alias resolution issues in test env)
const SHARE_TYPE = {
  FRIENDS: "FRIENDS",
  GROUP: "GROUP",
  NONE: "NONE",
} as const;
const TXN_TYPE = { LOAN_GIVEN: "LOAN_GIVEN" } as const; // Focusing on LOAN_GIVEN path due to LOAN_TAKEN validation inconsistency
const ACCOUNT_TYPE = {
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const;

interface AccountMock {
  id: number;
  userId: number;
  balance: number;
  type: string;
}

describe("LoanService - LOAN_GIVEN flow", () => {
  const payerId = 1; // lender
  const borrowerId = 2; // debtor
  const amount = 150;

  // Reusable mock accounts
  const loanGivenAcc: AccountMock = {
    id: 100,
    userId: payerId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_GIVEN,
  };
  const loanTakenAcc: AccountMock = {
    id: 200,
    userId: borrowerId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_TAKEN,
  };

  let service: LoanService;

  // Repository & service mocks
  const mockLoanRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any;
  const mockLoanPayerRepository = { create: vi.fn() } as any;
  const mockLoanSplitsRepository = { create: vi.fn() } as any;
  const mockGroupMemberRepository = {} as any;
  const mockGroupRepository = {} as any;
  const mockTransactionAccountRepository = {
    findByUserIdAndAccountId: vi.fn(),
    findByUserIdAndCategoryName: vi.fn(),
  } as any;
  const mockUserRepository = { findById: vi.fn() } as any;
  const mockTransactionService = {
    validateTransactionAccounts: vi.fn(),
    createTransactionHeader: vi.fn(),
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;
  const mockFriendService = {} as any;
  const mockBalanceAdjustmentService = {
    applyBilateralDelta: vi.fn(),
  } as any;

  const mockDb = {
    transaction: async (fn: any) => {
      const tx = { rollback: vi.fn() };
      return await fn(tx);
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // validateLoanTransaction account lookups (source then destination)
    mockTransactionAccountRepository.findByUserIdAndAccountId
      .mockResolvedValueOnce(loanGivenAcc) // source account (payer's LOAN_GIVEN)
      .mockResolvedValueOnce(loanTakenAcc); // destination account (borrower's LOAN_TAKEN)

    // transactionService.validateTransactionAccounts (later in createLoan)
    mockTransactionService.validateTransactionAccounts.mockResolvedValue({
      srcAcc: loanGivenAcc,
      dstAcc: loanTakenAcc,
    });

    mockTransactionService.createTransactionHeader.mockResolvedValue({
      id: 999,
    });

    // findByUserIdAndCategoryName inside createLoanAndHandleSplits (borrower LOAN_TAKEN then payer LOAN_GIVEN)
    mockTransactionAccountRepository.findByUserIdAndCategoryName
      .mockResolvedValueOnce(loanTakenAcc) // borrower loan taken account
      .mockResolvedValueOnce(loanGivenAcc); // payer loan given account

    mockUserRepository.findById.mockResolvedValue({
      id: payerId,
      currency: "USD",
    });

    mockLoanRepository.create.mockResolvedValue({
      id: 5000,
      amount,
      createdBy: payerId,
      currency: "USD",
      description: "Test loan",
      groupId: null,
      transactionId: 999,
    });

    mockLoanPayerRepository.create.mockResolvedValue({ id: 6000 });
    mockLoanSplitsRepository.create.mockResolvedValue({ id: 7000 });

    service = new LoanService({
      db: mockDb,
      loanPayerRepository: mockLoanPayerRepository,
      loanRepository: mockLoanRepository,
      loanSplitsRepository: mockLoanSplitsRepository,
      groupMemberRepository: mockGroupMemberRepository,
      groupRepository: mockGroupRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      userRepository: mockUserRepository,
      transactionService: mockTransactionService,
      friendService: mockFriendService,
      balanceAdjustmentService: mockBalanceAdjustmentService,
    });
  });

  it("creates a LOAN_GIVEN with single split, suppressing zero-amount payer entry, and applies bilateral balance delta", async () => {
    await service.createLoan({
      payer: payerId,
      sourceTransactionAccountID: loanGivenAcc.id,
      targetTransactionAccountID: loanTakenAcc.id,
      description: "Loan to friend",
      amount,
      type: TXN_TYPE.LOAN_GIVEN,
      sharedWith: SHARE_TYPE.FRIENDS,
      splitType: "EQUAL" as any,
      splits: [{ userId: borrowerId, amountOwed: amount }],
    } as any);

    // updateAccountsAndCreateEntries NOT called for zero payerTotal; only split entry
    expect(
      mockTransactionService.updateAccountsAndCreateEntries
    ).toHaveBeenCalledTimes(1); // Only per-split processing; payerTotal == 0 suppressed
    const entriesArg =
      mockTransactionService.updateAccountsAndCreateEntries.mock.calls[0][0];
    expect(entriesArg).toHaveLength(1);
    expect(entriesArg[0].amount).toBe(amount); // only split amount posted; payerTotal(0) suppressed

    // loan repositories invoked
    expect(mockLoanRepository.create).toHaveBeenCalled();
    expect(mockLoanPayerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaid: amount, userId: payerId }),
      expect.anything()
    );
    expect(mockLoanSplitsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amountOwed: amount, userId: borrowerId }),
      expect.anything()
    );

    // Balance adjustment applied: payer (creditor) vs borrower (debtor)
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenCalledWith(
      payerId,
      borrowerId,
      amount,
      "USD",
      null,
      expect.anything()
    );
  });

  it("rejects loan creation when more than one split provided", async () => {
    await expect(
      service.createLoan({
        payer: payerId,
        sourceTransactionAccountID: loanGivenAcc.id,
        targetTransactionAccountID: loanTakenAcc.id,
        description: "Invalid loan",
        amount,
        type: TXN_TYPE.LOAN_GIVEN,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL" as any,
        splits: [
          { userId: borrowerId, amountOwed: amount },
          { userId: 3, amountOwed: 10 },
        ],
      } as any)
    ).rejects.toThrow(/must have exactly one split entry/i);

    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it("rejects loan creation when split amount does not match total amount", async () => {
    await expect(
      service.createLoan({
        payer: payerId,
        sourceTransactionAccountID: loanGivenAcc.id,
        targetTransactionAccountID: loanTakenAcc.id,
        description: "Mismatch loan",
        amount,
        type: TXN_TYPE.LOAN_GIVEN,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL" as any,
        splits: [{ userId: borrowerId, amountOwed: amount - 1 }],
      } as any)
    ).rejects.toThrow(/Split amount must match the transaction amount/i);

    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it.skip("LOAN_TAKEN validation path pending correction (current implementation enforces payer == split user)", () => {
    // Documenting discovered inconsistency:
    // validateLoanTransaction looks up source account with payerId then requires it to equal split.userId for LOAN_TAKEN.
    // This makes distinct-party LOAN_TAKEN logically unreachable without a refactor.
    // Once fixed, add analogous tests for LOAN_TAKEN ensuring payerTotal == 0 and bilateral delta direction inverts.
  });
});

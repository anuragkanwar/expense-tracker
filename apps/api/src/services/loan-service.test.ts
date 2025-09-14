import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "./loan-service";

// Local enum replicas (avoid path alias resolution issues in test env)
const SHARE_TYPE = {
  FRIENDS: "FRIENDS",
  GROUP: "GROUP",
  NONE: "NONE",
} as const;
const TXN_TYPE = {
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const; // Added LOAN_TAKEN for negative asymmetry test
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

  it("creates a LOAN_GIVEN with single split (fallback path), suppresses zero-amount payer entry, applies bilateral balance delta, and returns created loan", async () => {
    const loan = await service.createLoan({
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

    expect(loan).toBeTruthy();
    expect(loan.id).toBe(5000);
    expect(loan.amount).toBe(amount);
    expect(loan.createdBy).toBe(payerId);

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

    // Balance adjustment applied: payer (creditor) vs borrower (debtor) via fallback
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

  it("delegates to InterpersonalDebtEngine when available (suppresses fallback)", async () => {
    // Reconfigure mocks for fresh call sequence
    mockTransactionAccountRepository.findByUserIdAndAccountId
      .mockResolvedValueOnce(loanGivenAcc)
      .mockResolvedValueOnce(loanTakenAcc);
    mockTransactionService.validateTransactionAccounts.mockResolvedValue({
      srcAcc: loanGivenAcc,
      dstAcc: loanTakenAcc,
    });
    mockTransactionAccountRepository.findByUserIdAndCategoryName
      .mockResolvedValueOnce(loanTakenAcc)
      .mockResolvedValueOnce(loanGivenAcc);

    const engineMock = {
      recordDirectLoan: vi.fn().mockResolvedValue(undefined),
      recordRepayment: vi.fn(),
    } as any;

    const engineAwareService = new LoanService({
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
      interpersonalDebtEngine: engineMock,
    });

    const loan = await engineAwareService.createLoan({
      payer: payerId,
      sourceTransactionAccountID: loanGivenAcc.id,
      targetTransactionAccountID: loanTakenAcc.id,
      description: "Loan to friend (engine)",
      amount,
      type: TXN_TYPE.LOAN_GIVEN,
      sharedWith: SHARE_TYPE.FRIENDS,
      splitType: "EQUAL" as any,
      splits: [{ userId: borrowerId, amountOwed: amount }],
    } as any);

    expect(loan.id).toBe(5000);

    expect(engineMock.recordDirectLoan).toHaveBeenCalledTimes(1);
    expect(engineMock.recordDirectLoan).toHaveBeenCalledWith(
      {
        creditorId: payerId,
        debtorId: borrowerId,
        amount,
        currency: "USD",
        groupId: null,
      },
      expect.anything()
    );

    // Fallback NOT used when engine present
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
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

  it("rejects direct loan with sharedWith NONE and does not persist loan metadata", async () => {
    await expect(
      service.createLoan({
        payer: payerId,
        sourceTransactionAccountID: loanGivenAcc.id,
        targetTransactionAccountID: loanTakenAcc.id,
        description: "Invalid NONE loan",
        amount,
        type: TXN_TYPE.LOAN_GIVEN,
        sharedWith: SHARE_TYPE.NONE,
        splitType: "EQUAL" as any,
        splits: [{ userId: borrowerId, amountOwed: amount }],
      } as any)
    ).rejects.toThrow(/Direct loan creation requires a shared context/i);

    // Ledger entry attempted prior to validation error
    expect(
      mockTransactionService.updateAccountsAndCreateEntries
    ).toHaveBeenCalledTimes(1);

    // No loan metadata persisted
    expect(mockLoanRepository.create).not.toHaveBeenCalled();
    expect(mockLoanPayerRepository.create).not.toHaveBeenCalled();
    expect(mockLoanSplitsRepository.create).not.toHaveBeenCalled();

    // No balance adjustment performed
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it("hard blocks LOAN_TAKEN creation with canonical message before any account validation", async () => {
    await expect(
      service.createLoan({
        payer: payerId,
        sourceTransactionAccountID: loanGivenAcc.id,
        targetTransactionAccountID: loanTakenAcc.id,
        description: "LOAN_TAKEN attempt",
        amount,
        type: TXN_TYPE.LOAN_TAKEN,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL" as any,
        splits: [{ userId: borrowerId, amountOwed: amount }],
      } as any)
    ).rejects.toThrow(/LOAN_TAKEN creation is disabled/i);

    // No downstream validation or persistence invoked
    expect(
      mockTransactionService.validateTransactionAccounts
    ).not.toHaveBeenCalled();
    expect(mockLoanRepository.create).not.toHaveBeenCalled();
    expect(
      mockTransactionService.updateAccountsAndCreateEntries
    ).not.toHaveBeenCalled();
  });

  // NOTE: Payer total non-zero guard for loan transactions ("For loan transactions, payer total must be 0")
  // is currently UNREACHABLE because validateLoanTransaction enforces split.amountOwed === amount
  // (payerTotal = amount - amount == 0). To test that guard we'd need to relax earlier validation
  // OR remove the redundant guard. Leaving documented here for future refactor.
});

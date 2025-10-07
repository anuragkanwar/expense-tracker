import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "./loan-service";
import { ACCOUNT_TYPE } from "@pocket-pixie/db-schema";

// Helper interfaces for testing
interface AccountMock {
  id: number;
  userId: number;
  balance: number;
  type: string;
  name?: string;
}

describe("Loan Service - Group Expense Sharing", () => {
  // Group members
  const payerId = 1;
  const memberIds = [2, 3, 4]; // Other group members
  const groupId = 42;

  // Mock accounts
  const payerLoanGivenAcc: AccountMock = {
    id: 102,
    userId: payerId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_GIVEN,
    name: "Loans Given",
  };

  // Member accounts (loan taken)
  const memberLoanTakenAccounts: Record<number, AccountMock> = {};
  memberIds.forEach((memberId, index) => {
    memberLoanTakenAccounts[memberId] = {
      id: 200 + index,
      userId: memberId,
      balance: 0,
      type: ACCOUNT_TYPE.LOAN_TAKEN,
      name: "Loans Taken",
    };
  });

  // Mock repositories and services
  let service: LoanService;

  // Common mocks
  const mockLoanRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockLoanSplitsRepository = {
    create: vi.fn(),
    findByLoanId: vi.fn(),
  };

  const mockGroupRepository = {
    findById: vi.fn(),
  };

  const mockGroupMemberRepository = {
    findByGroupIdAndUserId: vi.fn(),
  };

  const mockTransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  };

  const mockTransactionService = {
    createTransactionHeader: vi.fn(),
  };

  const mockFriendService = {
    areFriends: vi.fn(),
    friendRepository: {},
    getFriends: vi.fn(),
    sendFriendRequest: vi.fn(),
    getFriendRequests: vi.fn(),
    acceptFriendRequest: vi.fn(),
    rejectFriendRequest: vi.fn(),
  };

  const mockBalanceAdjustmentService = {
    applyBilateralDelta: vi.fn(),
    balanceRepository: {},
  };

  const mockTransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
    transactionRepository: {},
    transactionEntryRepository: {},
    transactionAccountRepository: {},
  };

  const mockInterpersonalDebtEngine = {
    recordDirectLoan: vi.fn(),
    recordGroupExpense: vi.fn(),
    recordRepayment: vi.fn(),
  };

  const mockDb = {
    transaction: vi.fn(async (fn: any) => {
      const tx = { rollback: vi.fn() };
      return await fn(tx);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Configure default mock behaviors
    mockGroupRepository.findById.mockResolvedValue({
      id: groupId,
      name: "Test Group",
    });

    // Setup group membership mocks
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && (uid === payerId || memberIds.includes(uid))) {
          return Promise.resolve({ id: uid });
        }
        return Promise.resolve(null);
      }
    );

    // Account lookup mocks
    mockTransactionAccountRepository.findByUserIdAndCategoryName.mockImplementation(
      (userId: number, type: string) => {
        if (userId === payerId && type === ACCOUNT_TYPE.LOAN_GIVEN) {
          return Promise.resolve(payerLoanGivenAcc);
        }
        if (memberIds.includes(userId) && type === ACCOUNT_TYPE.LOAN_TAKEN) {
          return Promise.resolve(memberLoanTakenAccounts[userId]);
        }
        return Promise.resolve(null);
      }
    );

    // Mock loan split response for enrichment
    mockLoanSplitsRepository.findByLoanId.mockResolvedValue([
      { userId: memberIds[0], loanId: 101 },
    ]);

    // Mock loan creation response
    mockLoanRepository.create.mockImplementation((data: any) =>
      Promise.resolve({
        id: 101,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    // Mock createTransactionHeader
    mockTransactionService.createTransactionHeader.mockResolvedValue({
      id: 999,
    });

    // Friendship default success
    mockFriendService.areFriends.mockResolvedValue(true);

    // Initialize the loan service
    service = new LoanService({
      loanRepository: mockLoanRepository,
      loanSplitsRepository: mockLoanSplitsRepository,
      groupMemberRepository: mockGroupMemberRepository,
      groupRepository: mockGroupRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      userRepository: {} as any,
      transactionService: mockTransactionService as any,
      transactionHelperService: mockTransactionHelperService as any,
      friendService: mockFriendService as any,
      balanceAdjustmentService: mockBalanceAdjustmentService as any,
      interpersonalDebtEngine: mockInterpersonalDebtEngine as any,
      db: mockDb as any,
    });
  });

  it("creates direct loan in group context", async () => {
    // Arrange
    const debtorId = memberIds[0];
    const loanAmount = 50;
    const currency = "USD";
    const description = "Group Trip Advance";

    // Act - create a loan directly
    const loan = await service.createDirectLoanSymmetric(
      {
        debtorId,
        amount: loanAmount,
        currency,
        description,
        groupId,
      },
      payerId
    );

    // Assert - verify loan was created with correct data
    expect(loan).toBeTruthy();
    expect(loan.amount).toBe(loanAmount);
    expect(loan.groupId).toBe(groupId);

    // Verify transaction header was created
    expect(mockTransactionService.createTransactionHeader).toHaveBeenCalled();

    // Verify account entries were created
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).toHaveBeenCalledTimes(1);

    // Verify debt engine was used instead of balance adjustment
    expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalled();
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it("creates direct loan with multiple amounts across multiple group members", async () => {
    // Arrange
    const loanAmounts = [50, 75, 30]; // Different amounts for each member
    const currency = "USD";
    const description = "Group Dinner Split";

    // Act & Assert for each member
    for (let i = 0; i < memberIds.length; i++) {
      const debtorId = memberIds[i];
      const loanAmount = loanAmounts[i];

      // Reset mocks for each iteration
      mockTransactionService.createTransactionHeader.mockClear();
      mockTransactionHelperService.updateAccountsAndCreateEntries.mockClear();
      mockInterpersonalDebtEngine.recordDirectLoan.mockClear();

      // Create loan for this member
      const loan = await service.createDirectLoanSymmetric(
        {
          debtorId,
          amount: loanAmount,
          currency,
          description,
          groupId,
        },
        payerId
      );

      // Verify loan was created with correct data
      expect(loan).toBeTruthy();
      expect(loan.amount).toBe(loanAmount);
      expect(loan.groupId).toBe(groupId);
      expect(loan.creditorId).toBe(payerId);
      expect(loan.debtorId).toBe(debtorId);

      // Verify transaction flow
      expect(mockTransactionService.createTransactionHeader).toHaveBeenCalled();
      expect(
        mockTransactionHelperService.updateAccountsAndCreateEntries
      ).toHaveBeenCalledWith(
        [
          {
            srcAcc: payerLoanGivenAcc,
            dstAcc: memberLoanTakenAccounts[debtorId],
            amount: loanAmount,
            txnId: 999, // From mockTransactionService
          },
        ],
        expect.anything()
      );

      // Verify debt recording
      expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalledWith(
        {
          creditorId: payerId,
          debtorId,
          amount: loanAmount,
          currency,
          groupId,
        },
        expect.anything()
      );
    }
  });

  it("validates currency format in loan relationship", async () => {
    // Arrange - extract createLoanRelationship method for direct testing
    const createLoanRelationship =
      service["createLoanRelationship"].bind(service);
    const debtorId = memberIds[0];
    const invalidCurrency = "USDD"; // Invalid 4-letter code

    // Act & Assert - should throw validation error on currency length
    await expect(
      createLoanRelationship(
        payerId,
        debtorId,
        100,
        999,
        invalidCurrency,
        groupId
      )
    ).rejects.toThrow(/Currency must be a 3-letter ISO code/);
  });

  it("rejects loan creation when debtor is not in the group", async () => {
    // Arrange - try to loan to a non-group member
    const nonMemberId = 99;
    const loanAmount = 50;

    // Override the membership check to fail
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && uid === payerId)
          return Promise.resolve({ id: uid });
        return Promise.resolve(null); // Non-member
      }
    );

    // Act & Assert - should throw validation error
    await expect(
      service.createDirectLoanSymmetric(
        {
          debtorId: nonMemberId,
          amount: loanAmount,
          currency: "USD",
          description: "Test Loan",
          groupId,
        },
        payerId
      )
    ).rejects.toThrow(/Both creditor and debtor must be members/);

    // Verify no transaction was created
    expect(
      mockTransactionService.createTransactionHeader
    ).not.toHaveBeenCalled();
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).not.toHaveBeenCalled();
  });

  it("rejects loan creation when creditor is not in the group", async () => {
    // Arrange - make the payer not a group member
    const debtorId = memberIds[0];
    const loanAmount = 50;

    // Override the membership check to fail for payer
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && memberIds.includes(uid))
          return Promise.resolve({ id: uid });
        return Promise.resolve(null); // Payer is not a member
      }
    );

    // Act & Assert - should throw validation error
    await expect(
      service.createDirectLoanSymmetric(
        {
          debtorId,
          amount: loanAmount,
          currency: "USD",
          description: "Test Loan",
          groupId,
        },
        payerId
      )
    ).rejects.toThrow(/Both creditor and debtor must be members/);

    // Verify no transaction was created
    expect(
      mockTransactionService.createTransactionHeader
    ).not.toHaveBeenCalled();
  });

  it("correctly handles multi-currency loan creation within a group", async () => {
    // Arrange
    const debtorId = memberIds[0];
    const loanAmount = 75.5;
    const currency = "EUR"; // Different currency
    const description = "Foreign currency advance";

    // Act - create a loan with different currency
    const loan = await service.createDirectLoanSymmetric(
      {
        debtorId,
        amount: loanAmount,
        currency,
        description,
        groupId,
      },
      payerId
    );

    // Assert
    expect(loan).toBeTruthy();
    expect(loan.currency).toBe(currency);

    // Verify debt engine was called with correct currency
    expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        creditorId: payerId,
        debtorId,
        amount: loanAmount,
        currency,
      }),
      expect.anything()
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionService } from "./transaction-service";
// Local enum replicas to avoid path alias resolution in test environment
const SHARE_TYPE = { FRIENDS: "FRIENDS", NONE: "NONE" } as const;
const TXN_TYPE = {
  EXPENSE: "EXPENSE",
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const;
const ACCOUNT_TYPE = {
  OUTGOING: "OUTGOING",
  EXPENSE: "EXPENSE",
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const;
const EXPENSE_SHARE_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
} as const;

// Narrow mock types
interface AccountMock {
  id: number;
  userId: number;
  balance: number;
  type?: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];
  name?: string;
}

describe("TransactionService - shared expense", () => {
  let service: TransactionService;
  const mockTransactionAccountRepository = {
    findByUserIdAndAccountId: vi.fn(),
    findByUserIdAndCategoryName: vi.fn(),
    update: vi.fn(),
  } as any;
  const mockTransactionEntryRepository = {
    create: vi.fn(),
  } as any;
  const mockTransactionRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any;
  const mockGroupRepository = {} as any;
  const mockGroupMemberRepository = {} as any;
  const mockBalanceRepository = {} as any; // no longer used directly
  const mockFriendService = { areFriends: vi.fn() } as any;
  const mockExpenseShareRepository = {
    createMany: vi.fn(),
  } as any;
  const mockBalanceAdjustmentService = {
    applyBilateralDelta: vi.fn(),
  } as any;
  const mockTransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;

  const mockDb = {
    transaction: vi.fn(async (fn: any) => {
      const tx = { rollback: vi.fn() };
      return await fn(tx);
    }),
  } as any;

  const payerId = 1;
  const splitUsers = [2, 3];

  const outgoingAcc: AccountMock = {
    id: 100,
    userId: payerId,
    balance: 1000,
    type: ACCOUNT_TYPE.OUTGOING,
  };
  const expenseAcc: AccountMock = {
    id: 101,
    userId: payerId,
    balance: 0,
    type: ACCOUNT_TYPE.EXPENSE,
  };
  const payerLoanGivenAcc: AccountMock = {
    id: 200,
    userId: payerId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_GIVEN,
  };
  const user2LoanTakenAcc: AccountMock = {
    id: 201,
    userId: 2,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_TAKEN,
  };
  const user3LoanTakenAcc: AccountMock = {
    id: 202,
    userId: 3,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_TAKEN,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTransactionAccountRepository.findByUserIdAndAccountId
      .mockResolvedValueOnce(outgoingAcc) // srcAcc
      .mockResolvedValueOnce(expenseAcc); // dstAcc

    mockTransactionRepository.create.mockResolvedValue({ id: 500 });

    mockTransactionAccountRepository.findByUserIdAndCategoryName
      // For first split user 2 LOAN_TAKEN
      .mockResolvedValueOnce(user2LoanTakenAcc)
      // Payer LOAN_GIVEN for user 2
      .mockResolvedValueOnce(payerLoanGivenAcc)
      // For second split user 3 LOAN_TAKEN
      .mockResolvedValueOnce(user3LoanTakenAcc)
      // Payer LOAN_GIVEN for user 3
      .mockResolvedValueOnce(payerLoanGivenAcc);

    mockExpenseShareRepository.createMany.mockResolvedValue([]);

    service = new TransactionService({
      balanceRepository: mockBalanceRepository,
      db: mockDb,
      groupMemberRepository: mockGroupMemberRepository,
      groupRepository: mockGroupRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      transactionEntryRepository: mockTransactionEntryRepository,
      transactionRepository: mockTransactionRepository,
      transactionHelperService: mockTransactionHelperService,
      friendService: mockFriendService,
      expenseShareRepository: mockExpenseShareRepository,
      balanceAdjustmentService: mockBalanceAdjustmentService,
    });
  });

  it("creates expense shares and adjusts balances for shared expense (FRIENDS)", async () => {
    await service.createTransaction(
      {
        payer: payerId,
        sourceTransactionAccountID: outgoingAcc.id,
        targetTransactionAccountID: expenseAcc.id,
        description: "Dinner",
        amount: 100,
        type: TXN_TYPE.EXPENSE,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL" as any,
        splits: [
          { userId: 2, amountOwed: 30 },
          { userId: 3, amountOwed: 20 },
        ],
      } as any,
      "USD"
    );

    // Expect bilateral balance adjustments for each participant
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenCalledTimes(2);
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenNthCalledWith(
      1,
      payerId,
      2,
      30,
      "USD",
      null,
      expect.anything()
    );
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenNthCalledWith(
      2,
      payerId,
      3,
      20,
      "USD",
      null,
      expect.anything()
    );

    // Expense shares: payer + 2 participants => 3 rows
    expect(mockExpenseShareRepository.createMany).toHaveBeenCalledTimes(1);
    const shareRowsArg = mockExpenseShareRepository.createMany.mock.calls[0][0];
    expect(shareRowsArg).toHaveLength(3);

    const payerShare = shareRowsArg.find((r: any) => r.isPayerShare === 1);
    expect(payerShare).toBeTruthy();
    expect(payerShare.amount).toBe(50); // payerTotal = 100 - (30 + 20)
    expect(payerShare.status).toBe(EXPENSE_SHARE_STATUS.PAID);

    const participantShares = shareRowsArg.filter(
      (r: any) => r.isPayerShare === 0
    );
    expect(participantShares).toHaveLength(2);
    for (const row of participantShares) {
      expect([2, 3]).toContain(row.participantUserId);
      expect(row.status).toBe(EXPENSE_SHARE_STATUS.UNPAID);
      expect(row.paidAmount).toBe(0);
    }
  });
});

describe("TransactionService - loan blocking guard", () => {
  let service: TransactionService;
  let mockDb: any;
  let mockTransactionAccountRepository: any;
  let mockTransactionHelperService: any;

  beforeEach(() => {
    mockDb = { transaction: vi.fn() };
    mockTransactionAccountRepository = {
      findByUserIdAndAccountId: vi.fn(),
      findByUserIdAndCategoryName: vi.fn(),
      update: vi.fn(),
    };
    mockTransactionHelperService = {
      updateAccountsAndCreateEntries: vi.fn(),
    };

    service = new TransactionService({
      balanceRepository: {} as any,
      db: mockDb,
      groupMemberRepository: {} as any,
      groupRepository: {} as any,
      transactionAccountRepository: mockTransactionAccountRepository,
      transactionEntryRepository: { create: vi.fn() } as any,
      transactionRepository: {
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      } as any,
      transactionHelperService: mockTransactionHelperService,
      friendService: { areFriends: vi.fn() } as any,
      expenseShareRepository: { createMany: vi.fn() } as any,
      balanceAdjustmentService: { applyBilateralDelta: vi.fn() } as any,
    });
  });

  it("blocks direct LOAN_GIVEN creation", async () => {
    await expect(
      service.createTransaction({
        payer: 1,
        sourceTransactionAccountID: 10,
        targetTransactionAccountID: 11,
        description: "Direct loan given attempt",
        amount: 50,
        type: TXN_TYPE.LOAN_GIVEN,
      } as any)
    ).rejects.toThrow(/Direct loan transactions must be created/i);

    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(
      mockTransactionAccountRepository.findByUserIdAndAccountId
    ).not.toHaveBeenCalled();
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).not.toHaveBeenCalled();
  });

  it("blocks direct LOAN_TAKEN creation", async () => {
    await expect(
      service.createTransaction({
        payer: 1,
        sourceTransactionAccountID: 10,
        targetTransactionAccountID: 11,
        description: "Direct loan taken attempt",
        amount: 75,
        type: TXN_TYPE.LOAN_TAKEN,
      } as any)
    ).rejects.toThrow(/Direct loan transactions must be created/i);

    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(
      mockTransactionAccountRepository.findByUserIdAndAccountId
    ).not.toHaveBeenCalled();
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).not.toHaveBeenCalled();
  });
});

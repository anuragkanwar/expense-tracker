import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "./loan-service";
import type { MockedFunction } from "vitest";

// Define DBTransactionType for test environment
type DBTransactionType = {
  rollback: () => Promise<void>;
} & Record<string, unknown>;

// Local enum replicas (avoid path alias issues in test env)
const ACCOUNT_TYPE = {
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const;

/**
 * Mock account structure for tests
 */
interface AccountMock {
  id: number;
  userId: number;
  balance: number;
  type: string;
  name?: string;
}

/**
 * Loan data structure for repository create operations
 */
interface LoanData {
  id?: number;
  creditorId: number;
  debtorId: number;
  amount: number;
  currency: string;
  description?: string;
  groupId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transaction entry structure for tests
 */
interface TransactionEntryData {
  srcAcc: AccountMock;
  dstAcc: AccountMock;
  amount: number;
  txnId: number;
}

// Repository interfaces for better typing
interface LoanRepository {
  create: MockedFunction<
    (
      data: LoanData,
      tx?: DBTransactionType
    ) => Promise<LoanData & { id: number }>
  >;
  findAll: MockedFunction<
    (
      userId: number,
      tx?: DBTransactionType
    ) => Promise<Array<LoanData & { id: number }>>
  >;
  findById: MockedFunction<
    (
      id: number,
      tx?: DBTransactionType
    ) => Promise<(LoanData & { id: number }) | null>
  >;
  update: MockedFunction<
    (
      id: number,
      data: Partial<LoanData>,
      tx?: DBTransactionType
    ) => Promise<LoanData & { id: number }>
  >;
  delete: MockedFunction<(id: number, tx?: DBTransactionType) => Promise<void>>;
}

interface LoanSplitRepository {
  create: MockedFunction<
    (
      data: { loanId: number; userId: number },
      tx?: DBTransactionType
    ) => Promise<{ id: number; loanId: number; userId: number }>
  >;
}

interface GroupMemberRepository {
  findByGroupIdAndUserId: MockedFunction<
    (
      groupId: number,
      userId: number,
      tx?: DBTransactionType
    ) => Promise<{ id: number } | null>
  >;
  findByGroupId: MockedFunction<
    (
      groupId: number,
      tx?: DBTransactionType
    ) => Promise<Array<{ id: number; userId: number }>>
  >;
}

interface GroupRepository {
  findById: MockedFunction<
    (
      id: number,
      tx?: DBTransactionType
    ) => Promise<{ id: number; name: string } | null>
  >;
}

interface TransactionAccountRepository {
  findByUserIdAndCategoryName: MockedFunction<
    (
      userId: number,
      type: string,
      tx?: DBTransactionType
    ) => Promise<AccountMock | null>
  >;
}

interface UserRepository {
  findById: MockedFunction<
    (
      id: number,
      tx?: DBTransactionType
    ) => Promise<{ id: number; username: string } | null>
  >;
}

interface TransactionHeader {
  id: number;
  userId: number;
  transactionDate: Date;
  description: string;
  type: string;
}

interface TransactionService {
  createTransactionHeader: MockedFunction<
    (
      data: {
        userId: number;
        description: string;
        type: string;
        transactionDate?: Date;
      },
      tx?: DBTransactionType
    ) => Promise<TransactionHeader>
  >;
}

interface TransactionHelperService {
  updateAccountsAndCreateEntries: MockedFunction<
    (entries: TransactionEntryData[], tx?: DBTransactionType) => Promise<void>
  >;
  transactionRepository: Record<string, unknown>;
  transactionEntryRepository: Record<string, unknown>;
  transactionAccountRepository: Record<string, unknown>;
}

interface FriendService {
  areFriends: MockedFunction<
    (
      userId1: number,
      userId2: number,
      tx?: DBTransactionType
    ) => Promise<boolean>
  >;
}

interface BalanceAdjustmentService {
  applyBilateralDelta: MockedFunction<
    (
      creditorId: number,
      debtorId: number,
      amount: number,
      currency: string,
      groupId: number | null,
      tx?: DBTransactionType
    ) => Promise<void>
  >;
}

interface InterpersonalDebtEngine {
  recordDirectLoan: MockedFunction<
    (
      params: {
        creditorId: number;
        debtorId: number;
        amount: number;
        currency: string;
        groupId?: number | null;
      },
      tx?: DBTransactionType
    ) => Promise<void>
  >;
}

interface MockDb {
  transaction: <T>(fn: (tx: DBTransactionType) => Promise<T>) => Promise<T>;
}

/**
 * Tests for the new symmetric createDirectLoanSymmetric method only.
 */
describe("LoanService.createDirectLoanSymmetric", () => {
  const creditorId = 10;
  const debtorId = 20;
  const amount = 50;

  const loanGivenAcc: AccountMock = {
    id: 100,
    userId: creditorId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_GIVEN,
  };
  const loanTakenAcc: AccountMock = {
    id: 200,
    userId: debtorId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_TAKEN,
  };

  let service: LoanService;
  let engineAwareService: LoanService;

  // Common mocks
  const mockLoanRepository: LoanRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockLoanSplitsRepository: LoanSplitRepository = {
    create: vi.fn(),
  };

  const mockGroupMemberRepository: GroupMemberRepository = {
    findByGroupIdAndUserId: vi.fn(),
    findByGroupId: vi.fn(),
  };

  const mockGroupRepository: GroupRepository = {
    findById: vi.fn(),
  };

  const mockTransactionAccountRepository: TransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  };

  const mockUserRepository: UserRepository = {
    findById: vi.fn(),
  }; // not used directly in symmetric path

  const mockTransactionService: TransactionService = {
    createTransactionHeader: vi.fn(),
  };

  const mockTransactionHelperService: TransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
    transactionRepository: {},
    transactionEntryRepository: {},
    transactionAccountRepository: {},
  };

  const mockFriendService: FriendService = {
    areFriends: vi.fn(),
  };

  const mockBalanceAdjustmentService: BalanceAdjustmentService = {
    applyBilateralDelta: vi.fn(),
  };

  const engineMock: InterpersonalDebtEngine = {
    recordDirectLoan: vi.fn(),
  };

  const mockDb: MockDb = {
    transaction: async <T>(
      fn: (tx: DBTransactionType) => Promise<T>
    ): Promise<T> => {
      const tx = { rollback: vi.fn() } as DBTransactionType;
      return await fn(tx);
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTransactionAccountRepository.findByUserIdAndCategoryName.mockImplementation(
      (userId: number, type: string) => {
        if (userId === creditorId && type === ACCOUNT_TYPE.LOAN_GIVEN)
          return Promise.resolve(loanGivenAcc);
        if (userId === debtorId && type === ACCOUNT_TYPE.LOAN_TAKEN)
          return Promise.resolve(loanTakenAcc);
        return Promise.resolve(null);
      }
    );

    mockTransactionService.createTransactionHeader.mockResolvedValue({
      id: 999,
      userId: creditorId,
      transactionDate: new Date(),
      description: "Test transaction",
      type: "LOAN",
    });
    mockLoanRepository.create.mockImplementation((data: any) =>
      Promise.resolve({ id: 555, ...data })
    );

    mockLoanSplitsRepository.create.mockResolvedValue({
      id: 700,
      loanId: 555,
      userId: debtorId,
    });

    // Friendship default success
    mockFriendService.areFriends.mockResolvedValue(true);

    service = new LoanService({
      db: mockDb,
      loanRepository: mockLoanRepository,
      loanSplitsRepository: mockLoanSplitsRepository,
      groupMemberRepository: mockGroupMemberRepository,
      groupRepository: mockGroupRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      userRepository: mockUserRepository,
      transactionService: mockTransactionService as any,
      transactionHelperService: mockTransactionHelperService as any,
      friendService: mockFriendService as any,
      balanceAdjustmentService: mockBalanceAdjustmentService as any,
    });

    engineAwareService = new LoanService({
      db: mockDb,
      loanRepository: mockLoanRepository,
      loanSplitsRepository: mockLoanSplitsRepository,
      groupMemberRepository: mockGroupMemberRepository,
      groupRepository: mockGroupRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      userRepository: mockUserRepository,
      transactionService: mockTransactionService as any,
      transactionHelperService: mockTransactionHelperService as any,
      friendService: mockFriendService as any,
      balanceAdjustmentService: mockBalanceAdjustmentService as any,
      interpersonalDebtEngine: engineMock as any,
    });
  });

  it("creates symmetric direct loan (friend context, fallback path)", async () => {
    const loan = await service.createDirectLoanSymmetric(
      { debtorId, amount, currency: "USD", description: "Lunch" },
      creditorId
    );

    expect(loan.id).toBe(555);
    expect(loan.creditorId).toBe(creditorId);
    expect(loan.debtorId).toBe(debtorId);

    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).toHaveBeenCalledTimes(1);
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenCalledWith(
      creditorId,
      debtorId,
      amount,
      "USD",
      null,
      expect.anything()
    );
    expect(engineMock.recordDirectLoan).not.toHaveBeenCalled();
  });

  it("creates symmetric direct loan (friend context, engine path)", async () => {
    const loan = await engineAwareService.createDirectLoanSymmetric(
      { debtorId, amount, currency: "USD", description: "Dinner" },
      creditorId
    );
    expect(loan.id).toBe(555);
    expect(engineMock.recordDirectLoan).toHaveBeenCalledWith(
      {
        creditorId,
        debtorId,
        amount,
        currency: "USD",
        groupId: null,
      },
      expect.anything()
    );
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it("creates symmetric direct loan (group context)", async () => {
    const groupId = 42;
    mockGroupRepository.findById.mockResolvedValue({ id: groupId });
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && (uid === creditorId || uid === debtorId))
          return Promise.resolve({ id: uid });
        return Promise.resolve(null);
      }
    );

    const loan = await service.createDirectLoanSymmetric(
      { debtorId, amount, currency: "USD", groupId },
      creditorId
    );
    expect(loan.groupId).toBe(groupId);
  });

  it("rejects when users are not friends (no group)", async () => {
    mockFriendService.areFriends.mockResolvedValueOnce(false);
    await expect(
      service.createDirectLoanSymmetric(
        { debtorId, amount, currency: "USD" },
        creditorId
      )
    ).rejects.toThrow(/Users must be friends/i);
  });

  it("rejects when group specified but one member missing", async () => {
    const groupId = 77;
    mockGroupRepository.findById.mockResolvedValue({ id: groupId });
    // Only creditor present
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && uid === creditorId)
          return Promise.resolve({ id: uid });
        return Promise.resolve(null);
      }
    );

    await expect(
      service.createDirectLoanSymmetric(
        { debtorId, amount, currency: "USD", groupId },
        creditorId
      )
    ).rejects.toThrow(/must be members/);
  });

  it("rejects self-loan", async () => {
    await expect(
      service.createDirectLoanSymmetric(
        { debtorId: creditorId, amount, currency: "USD" },
        creditorId
      )
    ).rejects.toThrow(/must be different users/);
  });

  it("rejects non-positive amount", async () => {
    await expect(
      service.createDirectLoanSymmetric(
        { debtorId, amount: 0, currency: "USD" },
        creditorId
      )
    ).rejects.toThrow(/Amount must be > 0/);
  });

  it("rejects invalid currency length", async () => {
    await expect(
      service.createDirectLoanSymmetric(
        { debtorId, amount, currency: "US" },
        creditorId
      )
    ).rejects.toThrow(/3-letter ISO/);
  });

  it("normalizes blank description to empty string", async () => {
    const loan = await service.createDirectLoanSymmetric(
      { debtorId, amount, currency: "USD", description: "   " },
      creditorId
    );
    expect(loan.description).toBe("");
  });

  it("accepts friend + group overlap (both are members) still succeeds", async () => {
    const groupId = 99;
    mockGroupRepository.findById.mockResolvedValue({ id: groupId });
    mockGroupMemberRepository.findByGroupIdAndUserId.mockImplementation(
      (gid: number, uid: number) => {
        if (gid === groupId && (uid === creditorId || uid === debtorId))
          return Promise.resolve({ id: uid });
        return Promise.resolve(null);
      }
    );

    const loan = await service.createDirectLoanSymmetric(
      { debtorId, amount, currency: "USD", groupId },
      creditorId
    );
    expect(loan.creditorId).toBe(creditorId);
    expect(loan.debtorId).toBe(debtorId);
    expect(loan.groupId).toBe(groupId);
  });
});

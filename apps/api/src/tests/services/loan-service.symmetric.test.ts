import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoanService } from "./loan-service";
import type { ValidationError } from "@/errors/validation-error";
import { type DBTransactionType } from "@/db";
import type { MockedFunction } from "vitest";
import { FriendshipError } from "@/errors/friendship-errors";
import { LoanCreateSymmetricInput } from "@pocket-pixie/contracts";
import { ACCOUNT_TYPE } from "@/db";

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
  findAll: MockedFunction<any>;
  findById: MockedFunction<any>;
  update: MockedFunction<any>;
  delete: MockedFunction<any>;
  count: MockedFunction<any>;
}

interface LoanSplitRepository {
  create: MockedFunction<any>;
}

interface GroupMemberRepository {
  findByGroupIdAndUserId: MockedFunction<any>;
  findByGroupId: MockedFunction<any>;
}

interface GroupRepository {
  findById: MockedFunction<any>;
}

interface TransactionAccountRepository {
  findByUserIdAndCategoryName: MockedFunction<
    (userId: number, type: string) => Promise<AccountMock | null>
  >;
}

interface UserRepository {
  findById: MockedFunction<any>;
}

interface TransactionService {
  createTransactionHeader: MockedFunction<any>;
}

interface TransactionHelperService {
  updateAccountsAndCreateEntries: MockedFunction<any>;
  transactionRepository: any;
  transactionEntryRepository: any;
  transactionAccountRepository: any;
}

interface FriendService {
  areFriends: MockedFunction<any>;
}

interface InterpersonalDebtEngine {
  recordDirectLoan: MockedFunction<any>;
  recordRepayment: MockedFunction<any>;
  recordGroupExpense?: MockedFunction<any>; // Optional for compatibility with other tests
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
    name: "Loan Given Account",
  };
  const loanTakenAcc: AccountMock = {
    id: 200,
    userId: debtorId,
    balance: 0,
    type: ACCOUNT_TYPE.LOAN_TAKEN,
    name: "Loan Taken Account",
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
    count: vi.fn(),
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

  const mockInterpersonalDebtEngine: InterpersonalDebtEngine = {
    recordDirectLoan: vi.fn(),
    recordRepayment: vi.fn(),
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
      interpersonalDebtEngine: mockInterpersonalDebtEngine,
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
      interpersonalDebtEngine: mockInterpersonalDebtEngine,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create a loan using the debt engine (happy path)", async () => {
    // Arrange
    const input: LoanCreateSymmetricInput = {
      debtorId,
      amount,
      currency: "USD",
      description: "Test loan",
    };

    // Act
    const result = await engineAwareService.createDirectLoanSymmetric(
      creditorId,
      input
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(555);
    expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalledWith(
      {
        creditorId,
        debtorId,
        amount,
        currency: "USD",
        description: "Test loan",
        groupId: null,
      },
      expect.anything() // transaction object
    );

    // Verify basic flow and validation still occurs
    expect(mockFriendService.areFriends).toHaveBeenCalledWith(
      creditorId,
      debtorId
    );
  });

  it("should handle group context correctly with the debt engine", async () => {
    // Arrange
    const groupId = 42;
    mockGroupMemberRepository.findByGroupIdAndUserId.mockResolvedValue({
      id: 1,
    });
    mockGroupRepository.findById.mockResolvedValue({
      id: groupId,
      name: "Test Group",
    });

    const input: LoanCreateSymmetricInput = {
      debtorId,
      amount,
      currency: "USD",
      groupId,
      description: "Group loan test",
    };

    // Act
    const result = await engineAwareService.createDirectLoanSymmetric(
      creditorId,
      input
    );

    // Assert
    expect(result).toBeDefined();
    expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalledWith(
      {
        creditorId,
        debtorId,
        amount,
        currency: "USD",
        description: "Group loan test",
        groupId,
      },
      expect.anything()
    );

    // Verify group membership checks still performed
    expect(
      mockGroupMemberRepository.findByGroupIdAndUserId
    ).toHaveBeenCalledWith(groupId, creditorId, undefined);
    expect(
      mockGroupMemberRepository.findByGroupIdAndUserId
    ).toHaveBeenCalledWith(groupId, debtorId, undefined);
  });

  it("should reject if users are not friends (personal context)", async () => {
    // Arrange
    mockFriendService.areFriends.mockResolvedValue(false);
    const input: LoanCreateSymmetricInput = {
      debtorId,
      amount,
      currency: "USD",
    };

    // Act & Assert
    await expect(
      engineAwareService.createDirectLoanSymmetric(creditorId, input)
    ).rejects.toBeInstanceOf(FriendshipError);

    // Verify debt engine not called for failed request
    expect(mockInterpersonalDebtEngine.recordDirectLoan).not.toHaveBeenCalled();
  });

  // Other validation tests remain the same...

  it("should perform data persistence even with the debt engine", async () => {
    // Arrange
    const input: LoanCreateSymmetricInput = {
      debtorId,
      amount,
      currency: "USD",
      description: "Test persistence",
    };

    // Act
    const result = await engineAwareService.createDirectLoanSymmetric(
      creditorId,
      input
    );

    // Assert - verify both debt engine AND persistence layer called
    expect(mockInterpersonalDebtEngine.recordDirectLoan).toHaveBeenCalled();
    expect(mockLoanRepository.create).toHaveBeenCalled();
    expect(mockLoanSplitsRepository.create).toHaveBeenCalled();
    expect(result.id).toBe(555);
  });
});

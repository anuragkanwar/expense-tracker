import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "./loan-service";

// Local enum replicas (avoid path alias issues in test env)
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
  const mockLoanRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any;

  const mockLoanSplitsRepository = { create: vi.fn() } as any;
  const mockGroupMemberRepository = {
    findByGroupIdAndUserId: vi.fn(),
    findByGroupId: vi.fn(),
  } as any;
  const mockGroupRepository = { findById: vi.fn() } as any;
  const mockTransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  } as any;
  const mockUserRepository = { findById: vi.fn() } as any; // not used directly in symmetric path
  const mockTransactionService = {
    createTransactionHeader: vi.fn(),
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;
  const mockFriendService = { areFriends: vi.fn() } as any;
  const mockBalanceAdjustmentService = { applyBilateralDelta: vi.fn() } as any;
  const engineMock = { recordDirectLoan: vi.fn() } as any;

  const mockDb = {
    transaction: async (fn: any) => {
      const tx = { rollback: vi.fn() };
      return await fn(tx);
    },
  } as any;

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
    });
    mockLoanRepository.create.mockImplementation((data: any) =>
      Promise.resolve({ id: 555, ...data })
    );

    mockLoanSplitsRepository.create.mockResolvedValue({ id: 700 });

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
      transactionService: mockTransactionService,
      friendService: mockFriendService,
      balanceAdjustmentService: mockBalanceAdjustmentService,
    });

    engineAwareService = new LoanService({
      db: mockDb,
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
      mockTransactionService.updateAccountsAndCreateEntries
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

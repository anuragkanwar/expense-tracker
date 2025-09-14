import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettlementService } from "./settlement-service";
import { IdempotencyKeyConflictError } from "../errors/idempotency-errors";

// Local enum replicas (simplified)
const ACCOUNT_TYPE = {
  LOAN_TAKEN: "LOAN_TAKEN",
  LOAN_GIVEN: "LOAN_GIVEN",
} as const;
const EXPENSE_SHARE_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
} as const;

describe("SettlementService - direct + allocation flows", () => {
  const payerId = 2; // debtor (participant paying back)
  const payeeId = 1; // creditor (original payer)
  const currency = "USD";
  const groupId: number | null = null;

  let service: SettlementService;

  // Repositories mocks
  const mockSettlementRepository = {
    create: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findById: vi.fn(),
  } as any;
  const mockTransactionRepository = { create: vi.fn() } as any;
  const mockTransactionEntryRepository = {} as any; // not invoked directly
  const mockTransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  } as any;
  const mockTransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;
  const mockExpenseShareRepository = {
    findAllocatableShares: vi.fn(),
    updateSharePayment: vi.fn(),
  } as any;
  const mockSettlementApplicationRepository = {
    create: vi.fn(),
    findBySettlementId: vi.fn(),
  } as any;
  const mockBalanceRepository = {} as any; // not used after refactor
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
    service = new SettlementService({
      settlementRepository: mockSettlementRepository,
      transactionRepository: mockTransactionRepository,
      transactionEntryRepository: mockTransactionEntryRepository,
      transactionAccountRepository: mockTransactionAccountRepository,
      transactionHelperService: mockTransactionHelperService,
      expenseShareRepository: mockExpenseShareRepository,
      settlementApplicationRepository: mockSettlementApplicationRepository,
      balanceRepository: mockBalanceRepository,
      db: mockDb,
      balanceAdjustmentService: mockBalanceAdjustmentService,
    });
  });

  // ---------- Direct Settlement Tests ----------
  it("rejects direct settlement when outstanding shares exist", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([
      { id: 10 },
    ]); // any non-empty array triggers rejection

    await expect(
      service.createDirectSettlement({
        payerId,
        payeeId,
        amount: 25,
        currency,
        groupId,
      })
    ).rejects.toThrow(/Outstanding expense shares/);
  });

  it("rejects direct settlement when amount exceeds outstanding (overpayment guard)", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);

    // Simulate outstanding 30
    mockBalanceRepository.findBalance = vi
      .fn()
      .mockResolvedValueOnce({ amount: 30 });

    await expect(
      service.createDirectSettlement({
        payerId,
        payeeId,
        amount: 40, // exceeds
        currency,
        groupId,
      })
    ).rejects.toThrow(/exceeds outstanding/);
  });

  it("creates direct settlement and applies negative bilateral delta when no shares", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);

    // Account lookups (payer LOAN_TAKEN, payee LOAN_GIVEN)
    mockTransactionAccountRepository.findByUserIdAndCategoryName
      .mockResolvedValueOnce({
        id: 201,
        userId: payerId,
        type: ACCOUNT_TYPE.LOAN_TAKEN,
        balance: 0,
      })
      .mockResolvedValueOnce({
        id: 101,
        userId: payeeId,
        type: ACCOUNT_TYPE.LOAN_GIVEN,
        balance: 0,
      });

    mockTransactionRepository.create.mockResolvedValue({ id: 500 }); // txn created even if amount>0; ledger entries suppressed only if amount<=0 (guard)
    const createdSettlement = {
      id: 900,
      amount: 40,
      payerId,
      payeeId,
      currency,
      settledAt: new Date().toISOString(),
      idempotencyKey: "direct-1",
    } as any;
    mockSettlementRepository.create.mockResolvedValue(createdSettlement);

    // Simulate outstanding exactly 40
    mockBalanceRepository.findBalance = vi
      .fn()
      .mockResolvedValueOnce({ amount: 40 });

    const { settlement, replay } = await service.createDirectSettlement({
      payerId,
      payeeId,
      amount: 40,
      currency,
      groupId,
      idempotencyKey: "direct-1",
    });

    expect(replay).toBe(false);
    expect(settlement).toMatchObject({ id: 900, amount: 40 });
    // Balance adjustment negative (reducing debt)
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenCalledWith(
      payeeId,
      payerId,
      -40,
      currency,
      groupId,
      expect.anything()
    );
  });

  it("replays idempotent direct settlement returning original record", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);

    const existing = {
      id: 901,
      payerId,
      payeeId,
      amount: 55,
      currency,
      settledAt: new Date(Date.now() - 5000).toISOString(),
      idempotencyKey: "direct-replay",
    } as any;

    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce(
      existing
    );

    // Simulate outstanding exactly 55 now
    mockBalanceRepository.findBalance = vi
      .fn()
      .mockResolvedValueOnce({ amount: 55 });

    const { settlement, replay } = await service.createDirectSettlement({
      payerId,
      payeeId,
      amount: 55,
      currency,
      groupId,
      idempotencyKey: "direct-replay",
    });

    expect(replay).toBe(true);
    expect(settlement).toBe(existing);
    expect(mockSettlementRepository.create).not.toHaveBeenCalled();
  });

  it("throws conflict on direct settlement idempotency key reuse with differing payload", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);

    const existing = {
      id: 902,
      payerId,
      payeeId,
      amount: 60,
      currency,
      settledAt: new Date(Date.now() - 3000).toISOString(),
      idempotencyKey: "direct-conflict",
    } as any;

    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce(
      existing
    );

    // Simulate outstanding exactly 65 now (irrelevant since conflict will trigger first)
    mockBalanceRepository.findBalance = vi
      .fn()
      .mockResolvedValueOnce({ amount: 65 });

    await expect(
      service.createDirectSettlement({
        payerId,
        payeeId,
        amount: 65, // different from existing 60
        currency,
        groupId,
        idempotencyKey: "direct-conflict",
      })
    ).rejects.toThrow(/Idempotency-Key reuse with differing payload/);
  });

  // ---------- Allocation Tests ----------
  it("allocates settlement FIFO across multiple shares updating statuses and balances", async () => {
    const shares = [
      {
        id: 1,
        amount: 50,
        paidAmount: 0,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
      },
      {
        id: 2,
        amount: 80,
        paidAmount: 20,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
      },
    ];
    // OutstandingBefore = (50-0)+(80-20)=110
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );

    // Accounts for ledger reversal entries
    mockTransactionAccountRepository.findByUserIdAndCategoryName
      .mockResolvedValueOnce({
        id: 300,
        userId: payerId,
        type: ACCOUNT_TYPE.LOAN_TAKEN,
        balance: 0,
      })
      .mockResolvedValueOnce({
        id: 301,
        userId: payeeId,
        type: ACCOUNT_TYPE.LOAN_GIVEN,
        balance: 0,
      });

    mockTransactionRepository.create.mockResolvedValue({ id: 777 });
    mockSettlementRepository.create.mockResolvedValue({
      id: 1000,
      payerId,
      payeeId,
      amount: 90,
      currency,
    });

    // updateSharePayment calls: first share (id=1) fully paid 50 -> PAID; second share apply 40 (20 existing + 40 = 60 < 80) PARTIALLY_PAID
    mockExpenseShareRepository.updateSharePayment
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });

    // settlement applications for share 1 (50) and share 2 (40)
    mockSettlementApplicationRepository.create
      .mockResolvedValueOnce({
        id: 501,
        settlementId: 1000,
        expenseShareId: 1,
        appliedAmount: 50,
      })
      .mockResolvedValueOnce({
        id: 502,
        settlementId: 1000,
        expenseShareId: 2,
        appliedAmount: 40,
      });

    const result = await service.allocateExpenseShareSettlement({
      payerId,
      payeeId,
      amount: 90,
      currency,
      groupId,
    });

    expect(result.totalApplied).toBe(90);
    expect(result.outstandingBefore).toBe(110);
    expect(result.outstandingAfter).toBe(20); // 110 - 90

    // updateSharePayment first full, then partial
    expect(
      mockExpenseShareRepository.updateSharePayment
    ).toHaveBeenNthCalledWith(
      1,
      1,
      50,
      EXPENSE_SHARE_STATUS.PAID,
      expect.anything()
    );
    expect(
      mockExpenseShareRepository.updateSharePayment
    ).toHaveBeenNthCalledWith(
      2,
      2,
      60,
      EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
      expect.anything()
    );

    // Applications created
    expect(mockSettlementApplicationRepository.create).toHaveBeenCalledTimes(2);

    // Balance adjusted negative totalApplied (reduces debt)
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).toHaveBeenCalledWith(
      payeeId,
      payerId,
      -90,
      currency,
      groupId,
      expect.anything()
    );
  });

  it("rejects allocation when amount exceeds outstanding", async () => {
    const shares = [
      {
        id: 1,
        amount: 30,
        paidAmount: 0,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
      },
    ];
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );

    await expect(
      service.allocateExpenseShareSettlement({
        payerId,
        payeeId,
        amount: 50, // outstandingBefore = 30
        currency,
        groupId,
      })
    ).rejects.toThrow(/exceeds outstanding/i);
  });

  it("replays idempotent allocation returning previous context", async () => {
    const shares = [
      {
        id: 1,
        amount: 40,
        paidAmount: 10,
        currency,
        status: EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
      },
    ];
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );

    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce({
      id: 555,
      amount: 30,
      payerId,
      payeeId,
      currency,
    });

    mockSettlementApplicationRepository.findBySettlementId.mockResolvedValueOnce(
      [
        { id: 9001, settlementId: 555, expenseShareId: 1, appliedAmount: 20 },
        { id: 9002, settlementId: 555, expenseShareId: 1, appliedAmount: 10 },
      ]
    );

    const result = await service.allocateExpenseShareSettlement({
      payerId,
      payeeId,
      amount: 30,
      currency,
      groupId,
      idempotencyKey: "idem-123",
    });

    expect(result.settlement.id).toBe(555);
    expect(result.totalApplied).toBe(30);
    // outstandingBefore approximation (reconstructed): current outstandingBefore (share.amount-share.paidAmount) + appliedSum
    // share.amount=40, paidAmount=10 => 30 current outstanding; appliedSum=30 => returned outstandingBefore ~ 60
    expect(result.outstandingBefore).toBe(60);
    expect(result.outstandingAfter).toBe(30);

    // No new create calls
    expect(mockSettlementRepository.create).not.toHaveBeenCalled();
    expect(mockSettlementApplicationRepository.create).not.toHaveBeenCalled();
    expect(
      mockBalanceAdjustmentService.applyBilateralDelta
    ).not.toHaveBeenCalled();
  });

  it("throws conflict when idempotency key reused with different payload (allocation)", async () => {
    const shares = [
      {
        id: 1,
        amount: 40,
        paidAmount: 10,
        currency,
        status: EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
      },
    ];
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );

    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce({
      id: 555,
      amount: 30, // ORIGINAL amount 30
      payerId,
      payeeId,
      currency,
    });

    await expect(
      service.allocateExpenseShareSettlement({
        payerId,
        payeeId,
        amount: 25, // DIFFERENT amount
        currency,
        groupId,
        idempotencyKey: "idem-conflict",
      })
    ).rejects.toThrow(/Idempotency-Key reuse with differing payload/i);
  });
});

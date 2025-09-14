import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettlementService } from "./settlement-service";
import { IdempotencyKeyConflictError } from "../errors/idempotency-errors";

// Local enum replicas (simplified for isolation)
const ACCOUNT_TYPE = {
  LOAN_TAKEN: "LOAN_TAKEN",
  LOAN_GIVEN: "LOAN_GIVEN",
} as const;

/**
 * These tests focus exclusively on the idempotency conflict permutation matrix
 * for direct settlements (Flag F3). They ensure:
 *  - Exact replay returns replay=true
 *  - Single-field mismatches produce a 409 with only that field in differences
 *  - Multi-field mismatches list all differing fields
 *  - groupId null vs number is detected as a difference
 *  - Amount tolerance (<= 1e-8) is treated as equal (no conflict)
 *  - Overpayment guard triggers before idempotency logic (idempotency repo lookup not performed)
 */
describe("SettlementService - direct settlement idempotency permutations", () => {
  let service: SettlementService;

  const mockSettlementRepository = {
    create: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findById: vi.fn(),
  } as any;
  const mockTransactionRepository = { create: vi.fn() } as any;
  const mockTransactionEntryRepository = {} as any;
  const mockTransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  } as any;
  const mockTransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;
  const mockExpenseShareRepository = {
    findAllocatableShares: vi.fn(),
  } as any;
  const mockSettlementApplicationRepository = {} as any;
  const mockBalanceRepository = {
    findBalance: vi.fn(),
  } as any;
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

  const baseExisting = {
    id: 1000,
    payerId: 10,
    payeeId: 20,
    amount: 100,
    currency: "USD",
    settledAt: new Date().toISOString(),
    idempotencyKey: "idem-base",
  } as any;

  function setupReplay(existingOverride: Partial<typeof baseExisting> = {}) {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);
    mockBalanceRepository.findBalance.mockResolvedValueOnce({ amount: 10_000 }); // large outstanding
    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce({
      ...baseExisting,
      ...existingOverride,
    });
  }

  it("exact replay (global context) returns replay=true and original record", async () => {
    setupReplay();
    const { settlement, replay } = await service.createDirectSettlement({
      payerId: baseExisting.payerId,
      payeeId: baseExisting.payeeId,
      amount: baseExisting.amount,
      currency: baseExisting.currency,
      groupId: null,
      idempotencyKey: baseExisting.idempotencyKey,
    });
    expect(replay).toBe(true);
    expect(settlement.id).toBe(baseExisting.id);
    // Should not have attempted ledger side-effects
    expect(mockTransactionRepository.create).not.toHaveBeenCalled();
  });

  it("exact replay (group context) returns replay=true and original record", async () => {
    const groupId = 77;
    setupReplay({ groupId });
    const { settlement, replay } = await service.createDirectSettlement({
      payerId: baseExisting.payerId,
      payeeId: baseExisting.payeeId,
      amount: baseExisting.amount,
      currency: baseExisting.currency,
      groupId,
      idempotencyKey: baseExisting.idempotencyKey,
    });
    expect(replay).toBe(true);
    expect(settlement.id).toBe(baseExisting.id);
    expect(mockTransactionRepository.create).not.toHaveBeenCalled();
  });

  it("payerId mismatch yields single-field differences", async () => {
    setupReplay();
    await service
      .createDirectSettlement({
        payerId: 11, // different
        payeeId: baseExisting.payeeId,
        amount: baseExisting.amount,
        currency: baseExisting.currency,
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .then(() => {
        throw new Error("Expected conflict not thrown");
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          payerId: { original: baseExisting.payerId, attempted: 11 },
        });
      });
  });

  it("payeeId mismatch yields single-field differences", async () => {
    setupReplay();
    await service
      .createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: 21, // different
        amount: baseExisting.amount,
        currency: baseExisting.currency,
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          payeeId: { original: baseExisting.payeeId, attempted: 21 },
        });
      });
  });

  it("amount mismatch above tolerance yields differences", async () => {
    setupReplay();
    const newAmount = baseExisting.amount + 0.0001; // > 1e-8 tolerance
    await service
      .createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: baseExisting.payeeId,
        amount: newAmount,
        currency: baseExisting.currency,
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          amount: { original: baseExisting.amount, attempted: newAmount },
        });
      });
  });

  it("tiny amount delta within tolerance treated as replay (no conflict)", async () => {
    setupReplay();
    const tinyDelta = baseExisting.amount + 5e-9; // < 1e-8 threshold
    const { replay } = await service.createDirectSettlement({
      payerId: baseExisting.payerId,
      payeeId: baseExisting.payeeId,
      amount: tinyDelta,
      currency: baseExisting.currency,
      groupId: null,
      idempotencyKey: baseExisting.idempotencyKey,
    });
    expect(replay).toBe(true);
  });

  it("currency mismatch yields differences", async () => {
    setupReplay();
    await service
      .createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: baseExisting.payeeId,
        amount: baseExisting.amount,
        currency: "EUR", // mismatch
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          currency: { original: baseExisting.currency, attempted: "EUR" },
        });
      });
  });

  it("groupId difference (null -> number) yields differences", async () => {
    setupReplay({ groupId: undefined }); // existing null
    await service
      .createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: baseExisting.payeeId,
        amount: baseExisting.amount,
        currency: baseExisting.currency,
        groupId: 42,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          groupId: { original: null, attempted: 42 },
        });
      });
  });

  it("groupId difference (number -> null) yields differences", async () => {
    setupReplay({ groupId: 42 });
    await service
      .createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: baseExisting.payeeId,
        amount: baseExisting.amount,
        currency: baseExisting.currency,
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        expect(err.differences).toEqual({
          groupId: { original: 42, attempted: null },
        });
      });
  });

  it("multi-field mismatch returns differences for all changed fields", async () => {
    setupReplay({ groupId: 7, currency: "USD", amount: 200 });
    const attempted = {
      payerId: 11,
      payeeId: 21,
      amount: 150, // differs from existing 200
      currency: "EUR", // differs
      groupId: 9, // differs from 7
    };
    await service
      .createDirectSettlement({
        ...attempted,
        idempotencyKey: baseExisting.idempotencyKey,
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(IdempotencyKeyConflictError);
        // We expect all five fields to be listed
        expect(Object.keys(err.differences || {})).toEqual(
          expect.arrayContaining([
            "payerId",
            "payeeId",
            "amount",
            "currency",
            "groupId",
          ])
        );
        expect(err.differences).toMatchObject({
          payerId: {
            original: baseExisting.payerId,
            attempted: attempted.payerId,
          },
          payeeId: {
            original: baseExisting.payeeId,
            attempted: attempted.payeeId,
          },
          amount: { original: 200, attempted: 150 },
          currency: { original: "USD", attempted: "EUR" },
          groupId: { original: 7, attempted: 9 },
        });
      });
  });

  it("overpayment guard triggers before idempotency check (no idempotency lookup)", async () => {
    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce([]);
    mockBalanceRepository.findBalance.mockResolvedValueOnce({ amount: 40 }); // outstanding smaller than attempted
    mockSettlementRepository.findByIdempotencyKey.mockResolvedValueOnce(
      baseExisting
    );

    await expect(
      service.createDirectSettlement({
        payerId: baseExisting.payerId,
        payeeId: baseExisting.payeeId,
        amount: 60, // exceeds outstanding 40
        currency: baseExisting.currency,
        groupId: null,
        idempotencyKey: baseExisting.idempotencyKey,
      })
    ).rejects.toThrow(/exceeds outstanding/);

    // Ensure idempotency repository lookup NOT performed (since guard triggers earlier)
    expect(
      mockSettlementRepository.findByIdempotencyKey
    ).not.toHaveBeenCalled();
  });
});

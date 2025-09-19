import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettlementService } from "../../services/settlement-service";
import { EXPENSE_SHARE_TYPE } from "../../db";

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

describe("SettlementService - Per-Allocation Ledger Entries", () => {
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

  const mockTransactionRepository = {
    create: vi.fn(),
  } as any;

  const mockTransactionAccountRepository = {
    findByUserIdAndCategoryName: vi.fn(),
  } as any;

  const mockTransactionHelperService = {
    updateAccountsAndCreateEntries: vi.fn(),
  } as any;

  const mockExpenseShareRepository = {
    findAllocatableShares: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
  } as any;

  const mockSettlementApplicationRepository = {
    create: vi.fn(),
    findBySettlementId: vi.fn(),
  } as any;

  const mockInterpersonalDebtEngine = {
    recordRepayment: vi.fn(),
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
      transactionAccountRepository: mockTransactionAccountRepository,
      transactionHelperService: mockTransactionHelperService,
      expenseShareRepository: mockExpenseShareRepository,
      settlementApplicationRepository: mockSettlementApplicationRepository,
      interpersonalDebtEngine: mockInterpersonalDebtEngine,
      db: mockDb,
    });
  });

  it("creates parent and child transactions for settlement allocations", async () => {
    // Test data
    const parentTransactionId = 800;
    const childTransaction1Id = 801;
    const childTransaction2Id = 802;
    const settlementId = 1000;

    // Setup allocatable shares
    const shares = [
      {
        id: 1,
        amount: 50,
        paidAmount: 0,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
        type: EXPENSE_SHARE_TYPE.EXPENSE,
      },
      {
        id: 2,
        amount: 30,
        paidAmount: 0,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
        type: EXPENSE_SHARE_TYPE.LOAN,
      },
    ];

    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );

    // Setup expense share details for contextual information
    mockExpenseShareRepository.findById
      .mockResolvedValueOnce({
        id: 1,
        amount: 50,
        paidAmount: 0,
        type: EXPENSE_SHARE_TYPE.EXPENSE,
      })
      .mockResolvedValueOnce({
        id: 2,
        amount: 30,
        paidAmount: 0,
        type: EXPENSE_SHARE_TYPE.LOAN,
      });

    // Setup account lookup
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

    // Setup transaction creation responses
    mockTransactionRepository.create
      .mockResolvedValueOnce({ id: parentTransactionId }) // Parent transaction
      .mockResolvedValueOnce({ id: childTransaction1Id }) // First allocation transaction
      .mockResolvedValueOnce({ id: childTransaction2Id }); // Second allocation transaction

    // Setup settlement creation
    mockSettlementRepository.create.mockResolvedValueOnce({
      id: settlementId,
      payerId,
      payeeId,
      amount: 80, // Total amount to settle
      currency,
      transactionId: parentTransactionId,
    });

    // Setup settlement application creation
    mockSettlementApplicationRepository.create
      .mockResolvedValueOnce({
        id: 501,
        settlementId,
        expenseShareId: 1,
        appliedAmount: 50,
      })
      .mockResolvedValueOnce({
        id: 502,
        settlementId,
        expenseShareId: 2,
        appliedAmount: 30,
      });

    // Execute settlement allocation
    const result = await service.allocateSettlement({
      payerId,
      payeeId,
      amount: 80, // Settle both shares fully
      currency,
    });

    // Verify results
    expect(result.totalApplied).toBe(80);
    expect(result.outstandingBefore).toBe(80);
    expect(result.outstandingAfter).toBe(0);

    // Verify transaction creation flow
    // 1. First the parent transaction is created
    expect(mockTransactionRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        description: expect.stringContaining("Settlement allocation"),
        userId: payerId,
      }),
      expect.anything()
    );

    // 2. Then child transactions are created for each allocation
    expect(mockTransactionRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        description: expect.stringContaining(
          "Allocation: 50 USD for expense share #1"
        ),
        userId: payerId,
        parentTransactionId: parentTransactionId,
      }),
      expect.anything()
    );

    expect(mockTransactionRepository.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        description: expect.stringContaining(
          "Allocation: 30 USD for loan share #2"
        ),
        userId: payerId,
        parentTransactionId: parentTransactionId,
      }),
      expect.anything()
    );

    // Verify entries created for parent and each child transaction
    // Parent transaction entries
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).toHaveBeenNthCalledWith(
      1,
      [
        expect.objectContaining({
          srcAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_TAKEN }),
          dstAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_GIVEN }),
          amount: 80,
          txnId: parentTransactionId,
        }),
      ],
      expect.anything()
    );

    // First child transaction entries
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).toHaveBeenNthCalledWith(
      2,
      [
        expect.objectContaining({
          srcAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_TAKEN }),
          dstAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_GIVEN }),
          amount: 50,
          txnId: childTransaction1Id,
        }),
      ],
      expect.anything()
    );

    // Second child transaction entries
    expect(
      mockTransactionHelperService.updateAccountsAndCreateEntries
    ).toHaveBeenNthCalledWith(
      3,
      [
        expect.objectContaining({
          srcAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_TAKEN }),
          dstAcc: expect.objectContaining({ type: ACCOUNT_TYPE.LOAN_GIVEN }),
          amount: 30,
          txnId: childTransaction2Id,
        }),
      ],
      expect.anything()
    );

    // Verify interpersonal debt update
    expect(mockInterpersonalDebtEngine.recordRepayment).toHaveBeenCalledWith(
      expect.objectContaining({
        creditorId: payeeId,
        debtorId: payerId,
        amount: 80,
        currency,
        groupId: null,
      }),
      expect.anything()
    );
  });

  it("includes detailed context in child transaction descriptions", async () => {
    // Setup minimal test case to verify descriptions
    const parentTransactionId = 900;
    const childTransactionId = 901;

    // Single share for simplicity
    const shares = [
      {
        id: 5,
        amount: 75.5,
        paidAmount: 25.5,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
        type: EXPENSE_SHARE_TYPE.EXPENSE,
      },
    ];

    mockExpenseShareRepository.findAllocatableShares.mockResolvedValueOnce(
      shares
    );
    mockExpenseShareRepository.findById.mockResolvedValueOnce({
      id: 5,
      amount: 75.5,
      paidAmount: 25.5,
      type: EXPENSE_SHARE_TYPE.EXPENSE,
      description: "Dinner at restaurant",
    });

    // Setup account lookup
    mockTransactionAccountRepository.findByUserIdAndCategoryName
      .mockResolvedValueOnce({
        id: 300,
        userId: payerId,
        type: ACCOUNT_TYPE.LOAN_TAKEN,
      })
      .mockResolvedValueOnce({
        id: 301,
        userId: payeeId,
        type: ACCOUNT_TYPE.LOAN_GIVEN,
      });

    // Setup transaction creation
    mockTransactionRepository.create
      .mockResolvedValueOnce({ id: parentTransactionId })
      .mockResolvedValueOnce({ id: childTransactionId });

    // Other required mocks
    mockSettlementRepository.create.mockResolvedValueOnce({
      id: 600,
      payerId,
      payeeId,
      amount: 50,
      currency,
    });
    mockSettlementApplicationRepository.create.mockResolvedValueOnce({
      id: 701,
      settlementId: 600,
      expenseShareId: 5,
      appliedAmount: 50,
    });

    // Execute settlement
    await service.allocateSettlement({
      payerId,
      payeeId,
      amount: 50,
      currency,
    });

    // Verify parent transaction description
    expect(mockTransactionRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        description: expect.stringContaining(
          "Settlement allocation (obligation)"
        ),
      }),
      expect.anything()
    );

    // Verify child transaction has detailed description
    expect(mockTransactionRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        description: expect.stringContaining(
          "Allocation: 50 USD for expense share #5"
        ),
        parentTransactionId: parentTransactionId,
      }),
      expect.anything()
    );
  });

  it("filters allocations by type correctly", async () => {
    // Setup shares of different types
    const expenseShares = [
      {
        id: 10,
        amount: 40,
        paidAmount: 0,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
        type: EXPENSE_SHARE_TYPE.EXPENSE,
      },
    ];

    const loanShares = [
      {
        id: 20,
        amount: 60,
        paidAmount: 0,
        payerUserId: payeeId,
        participantUserId: payerId,
        currency,
        status: EXPENSE_SHARE_STATUS.UNPAID,
        type: EXPENSE_SHARE_TYPE.LOAN,
      },
    ];

    // Setup for expense-only allocation
    mockExpenseShareRepository.findAllocatableShares
      .mockResolvedValueOnce(expenseShares) // For expense type
      .mockResolvedValueOnce(loanShares); // For loan type

    mockExpenseShareRepository.findById
      .mockResolvedValueOnce({
        id: 10,
        amount: 40,
        paidAmount: 0,
        type: EXPENSE_SHARE_TYPE.EXPENSE,
      })
      .mockResolvedValueOnce({
        id: 20,
        amount: 60,
        paidAmount: 0,
        type: EXPENSE_SHARE_TYPE.LOAN,
      });

    mockTransactionAccountRepository.findByUserIdAndCategoryName.mockImplementation(
      () => ({
        id: Math.floor(Math.random() * 1000),
        type:
          Math.random() > 0.5
            ? ACCOUNT_TYPE.LOAN_TAKEN
            : ACCOUNT_TYPE.LOAN_GIVEN,
      })
    );

    mockTransactionRepository.create.mockImplementation(() => ({
      id: Math.floor(Math.random() * 1000),
    }));

    mockSettlementRepository.create.mockImplementation((data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
    }));

    mockSettlementApplicationRepository.create.mockImplementation((data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
    }));

    // Test expense-specific allocation
    await service.allocateExpenseShareSettlement({
      payerId,
      payeeId,
      amount: 40,
      currency,
    });

    // Verify expense type was passed to findAllocatableShares
    expect(
      mockExpenseShareRepository.findAllocatableShares
    ).toHaveBeenNthCalledWith(
      1,
      payerId,
      payeeId,
      currency,
      null,
      EXPENSE_SHARE_TYPE.EXPENSE,
      expect.anything()
    );

    // Test loan-specific allocation
    await service.allocateLoanSettlement({
      payerId,
      payeeId,
      amount: 60,
      currency,
    });

    // Verify loan type was passed to findAllocatableShares
    expect(
      mockExpenseShareRepository.findAllocatableShares
    ).toHaveBeenNthCalledWith(
      2,
      payerId,
      payeeId,
      currency,
      null,
      EXPENSE_SHARE_TYPE.LOAN,
      expect.anything()
    );
  });
});

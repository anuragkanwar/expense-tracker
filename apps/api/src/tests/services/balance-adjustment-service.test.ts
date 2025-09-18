import { describe, it, expect, vi, beforeEach } from "vitest";
import { BalanceAdjustmentService } from "./balance-adjustment-service";

// Minimal shape returned by BalanceRepository.findBalance
interface MockBalanceRow {
  id: number;
  amount: number;
  ownerId: number;
  counterPartyId: number;
  groupId?: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

describe("BalanceAdjustmentService", () => {
  let service: BalanceAdjustmentService;
  const mockBalanceRepository = {
    findBalance: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BalanceAdjustmentService({
      balanceRepository: mockBalanceRepository,
    });
  });

  it("creates bilateral rows when none exist (overall context)", async () => {
    mockBalanceRepository.findBalance
      .mockResolvedValueOnce(null) // creditor row missing
      .mockResolvedValueOnce(null); // debtor row missing

    mockBalanceRepository.create
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });

    await service.applyBilateralDelta(10, 20, 50, "USD", null);

    expect(mockBalanceRepository.findBalance).toHaveBeenNthCalledWith(
      1,
      10,
      20,
      undefined,
      undefined
    );
    expect(mockBalanceRepository.findBalance).toHaveBeenNthCalledWith(
      2,
      20,
      10,
      undefined,
      undefined
    );

    // First create: creditor perspective +50
    expect(mockBalanceRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        ownerId: 10,
        counterPartyId: 20,
        amount: 50,
        currency: "USD",
      }),
      undefined
    );
    // Second create: debtor perspective -50
    expect(mockBalanceRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        ownerId: 20,
        counterPartyId: 10,
        amount: -50,
        currency: "USD",
      }),
      undefined
    );
  });

  it("updates existing bilateral rows (overall context)", async () => {
    const creditorRow: MockBalanceRow = {
      id: 1,
      amount: 75,
      ownerId: 10,
      counterPartyId: 20,
      currency: "USD",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const debtorRow: MockBalanceRow = {
      id: 2,
      amount: -75,
      ownerId: 20,
      counterPartyId: 10,
      currency: "USD",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBalanceRepository.findBalance
      .mockResolvedValueOnce(creditorRow)
      .mockResolvedValueOnce(debtorRow);

    await service.applyBilateralDelta(10, 20, 25, "USD", null);

    // Creditor row increases by +25 (75 -> 100)
    expect(mockBalanceRepository.update).toHaveBeenNthCalledWith(
      1,
      1,
      { amount: 100 },
      undefined
    );
    // Debtor row decreases by -25 (-75 -> -100)
    expect(mockBalanceRepository.update).toHaveBeenNthCalledWith(
      2,
      2,
      { amount: -100 },
      undefined
    );
  });

  it("applies negative delta to reduce debt (settlement semantics)", async () => {
    const creditorRow: MockBalanceRow = {
      id: 1,
      amount: 120,
      ownerId: 10,
      counterPartyId: 20,
      currency: "USD",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const debtorRow: MockBalanceRow = {
      id: 2,
      amount: -120,
      ownerId: 20,
      counterPartyId: 10,
      currency: "USD",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBalanceRepository.findBalance
      .mockResolvedValueOnce(creditorRow)
      .mockResolvedValueOnce(debtorRow);

    await service.applyBilateralDelta(10, 20, -50, "USD", null);

    // Creditor row decreased (120 + -50 = 70)
    expect(mockBalanceRepository.update).toHaveBeenNthCalledWith(
      1,
      1,
      { amount: 70 },
      undefined
    );
    // Debtor row increases toward zero (-120 - -50 = -70)
    expect(mockBalanceRepository.update).toHaveBeenNthCalledWith(
      2,
      2,
      { amount: -70 },
      undefined
    );
  });

  it("handles group-scoped balances distinctly", async () => {
    mockBalanceRepository.findBalance
      .mockResolvedValueOnce(null) // creditor group row missing
      .mockResolvedValueOnce(null); // debtor group row missing

    mockBalanceRepository.create
      .mockResolvedValueOnce({ id: 11 })
      .mockResolvedValueOnce({ id: 12 });

    await service.applyBilateralDelta(5, 6, 33.33, "INR", 999);

    expect(mockBalanceRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        ownerId: 5,
        counterPartyId: 6,
        amount: 33.33,
        groupId: 999,
      }),
      undefined
    );
    expect(mockBalanceRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        ownerId: 6,
        counterPartyId: 5,
        amount: -33.33,
        groupId: 999,
      }),
      undefined
    );
  });
});

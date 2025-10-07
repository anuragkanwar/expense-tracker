import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardService } from "./dashboard-service";

describe("DashboardService", () => {
  const userId = 1;

  // Mock dashboard repository with typed methods
  const mockDashboardRepository = {
    getMonthlyExpenses: vi.fn(),
    getMonthlyIncome: vi.fn(),
    getMonthlyLoanTaken: vi.fn(),
    getMonthlyLoanGiven: vi.fn(),
    getBudgetUtilization: vi.fn(),
    getTopExpenseCategory: vi.fn(),
    getSpendingAnalytics: vi.fn(),
    getSpendingByCategory: vi.fn(),
    getUpcomingBills: vi.fn(),
    getNetWorthTrend: vi.fn(),
  };

  let service: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockDashboardRepository.getMonthlyExpenses.mockResolvedValue(500);
    mockDashboardRepository.getMonthlyIncome.mockResolvedValue(1000);
    mockDashboardRepository.getMonthlyLoanTaken.mockResolvedValue(200);
    mockDashboardRepository.getMonthlyLoanGiven.mockResolvedValue(300);
    mockDashboardRepository.getBudgetUtilization.mockResolvedValue(65);
    mockDashboardRepository.getTopExpenseCategory.mockResolvedValue({
      name: "Groceries",
      amount: 200,
      percentage: 40,
    });

    service = new DashboardService({
      dashboardRepository: mockDashboardRepository,
    });
  });

  describe("getMonthlySummary", () => {
    it("retrieves and aggregates monthly summary data correctly", async () => {
      // Act
      const result = await service.getMonthlySummary(userId);

      // Assert
      expect(result).toMatchObject({
        totalIncome: 1000,
        totalExpenses: 500,
        totalLoanGiven: 300,
        totalLoanTaken: 200,
        netIncome: 500, // 1000 - 500
        budgetUtilization: 65,
        savingsRate: 50, // (500/1000) * 100
        topExpenseCategory: {
          name: "Groceries",
          amount: 200,
          percentage: 40,
        },
      });

      // Verify repository methods were called with correct date range
      expect(mockDashboardRepository.getMonthlyExpenses).toHaveBeenCalledWith(
        userId,
        expect.any(Date), // startOfMonth
        expect.any(Date) // endOfMonth
      );
    });

    it("handles no expenses gracefully", async () => {
      // Arrange
      mockDashboardRepository.getTopExpenseCategory.mockResolvedValue(null);
      mockDashboardRepository.getMonthlyExpenses.mockResolvedValue(0);

      // Act
      const result = await service.getMonthlySummary(userId);

      // Assert
      expect(result.topExpenseCategory).toEqual({
        name: "No expenses",
        amount: 0,
        percentage: 0,
      });
      expect(result.totalExpenses).toBe(0);
      expect(result.savingsRate).toBe(100); // 100% savings rate when no expenses
    });

    it("handles zero income gracefully", async () => {
      // Arrange
      mockDashboardRepository.getMonthlyIncome.mockResolvedValue(0);

      // Act
      const result = await service.getMonthlySummary(userId);

      // Assert
      expect(result.savingsRate).toBe(0); // Prevents division by zero
      expect(result.netIncome).toBe(-500); // 0 - 500
    });
  });

  describe("getNetWorthTrend", () => {
    it("retrieves net worth trend with default months", async () => {
      // Arrange
      const mockTrendData = [
        {
          date: "2023-01-31",
          netWorth: 5000,
          assets: 8000,
          liabilities: 3000,
          change: 500,
          changePercentage: 10,
        },
      ];
      mockDashboardRepository.getNetWorthTrend.mockResolvedValue(mockTrendData);

      // Act
      const result = await service.getNetWorthTrend(userId);

      // Assert
      expect(result).toEqual(mockTrendData);
      expect(mockDashboardRepository.getNetWorthTrend).toHaveBeenCalledWith(
        userId,
        12
      );
    });

    it("retrieves net worth trend with specified months", async () => {
      // Arrange
      const months = 6;
      mockDashboardRepository.getNetWorthTrend.mockResolvedValue([]);

      // Act
      await service.getNetWorthTrend(userId, months);

      // Assert
      expect(mockDashboardRepository.getNetWorthTrend).toHaveBeenCalledWith(
        userId,
        months
      );
    });
  });

  describe("getSpendingAnalytics", () => {
    it("returns analytics data when available", async () => {
      // Arrange
      const mockAnalytics = {
        totalSpending: 1000,
        categories: [],
        analytics: {
          numberOfCategories: 5,
          averageSpendingPerCategory: 200,
          minSpending: 50,
          maxSpending: 300,
          totalTransactions: 15,
          sumOfPercentages: 100,
          standardDeviation: 50,
        },
      };
      mockDashboardRepository.getSpendingAnalytics.mockResolvedValue(
        mockAnalytics
      );

      // Act
      const result = await service.getSpendingAnalytics(userId);

      // Assert
      expect(result).toEqual(mockAnalytics);
    });

    it("returns null when no analytics data is available", async () => {
      // Arrange
      mockDashboardRepository.getSpendingAnalytics.mockResolvedValue(null);

      // Act
      const result = await service.getSpendingAnalytics(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getUpcomingBills", () => {
    it("uses default days when not specified", async () => {
      // Act
      await service.getUpcomingBills(userId);

      // Assert
      expect(mockDashboardRepository.getUpcomingBills).toHaveBeenCalledWith(
        userId,
        30
      );
    });

    it("uses specified days when provided", async () => {
      // Act
      await service.getUpcomingBills(userId, 14);

      // Assert
      expect(mockDashboardRepository.getUpcomingBills).toHaveBeenCalledWith(
        userId,
        14
      );
    });
  });
});

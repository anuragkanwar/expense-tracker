import { DashboardRepository } from "@/repositories/dashboard-repository";
import { EXPENSE_SHARE_TYPE } from "@/db";
import type {
  MonthlySummaryResponse,
  SpendingAnalyticsResponse,
  SpendingByCategoryResponse,
  UpcomingBillsResponse,
  NetWorthTrendResponse,
} from "@pocket-pixie/contracts";

/**
 * UnifiedDashboardService provides dashboard data using the unified schema
 * that combines both expense shares and loans in the same table.
 */
export class DashboardService {
  private readonly dashboardRepository;

  constructor({
    dashboardRepository,
  }: {
    dashboardRepository: DashboardRepository;
  }) {
    this.dashboardRepository = dashboardRepository;
  }

  /**
   * Gets the monthly summary data for the user, including expenses, income,
   * loans given and taken using the unified schema.
   *
   * @param userId User ID to get summary for
   * @returns Monthly summary data
   */
  async getMonthlySummary(userId: number): Promise<MonthlySummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get expenses and income (unchanged from original implementation)
    const totalExpenses = await this.dashboardRepository.getMonthlyExpenses(
      userId,
      startOfMonth,
      endOfMonth
    );
    const totalIncome = await this.dashboardRepository.getMonthlyIncome(
      userId,
      startOfMonth,
      endOfMonth
    );

    // Get loans using the unified schema
    const loans = await this.dashboardRepository.getTotalObligationsByType(
      userId,
      EXPENSE_SHARE_TYPE.LOAN,
      true, // as creditor
      true, // as debtor
      startOfMonth,
      endOfMonth
    );

    const budgetUtilization =
      await this.dashboardRepository.getBudgetUtilization(
        userId,
        startOfMonth,
        endOfMonth
      );

    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Get top expense category
    const topExpenseCategoryData =
      await this.dashboardRepository.getTopExpenseCategory(
        userId,
        startOfMonth,
        endOfMonth
      );

    const topExpenseCategory = topExpenseCategoryData || {
      name: "No expenses",
      amount: 0,
      percentage: 0,
    };

    return {
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      totalIncome,
      totalExpenses,
      // Use data from the unified schema
      totalLoanGiven: loans.given,
      totalLoanTaken: loans.taken,
      netIncome,
      budgetUtilization,
      savingsRate,
      topExpenseCategory,
    };
  }

  /**
   * Gets detailed spending analytics for the user.
   * This implementation is unchanged from the original since expense categories
   * are not affected by the schema unification.
   *
   * @param userId User ID to get analytics for
   * @returns Spending analytics data or null if no data
   */
  async getSpendingAnalytics(
    userId: number
  ): Promise<SpendingAnalyticsResponse | null> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // We'll delegate to the original repository implementation
    // since expense categories are not affected by the schema unification
    const analytics = await this.dashboardRepository.getSpendingByCategory(
      userId,
      startOfMonth,
      endOfMonth
    );

    if (!analytics || analytics.length === 0) {
      return null;
    }

    // Format the response to match the expected SpendingAnalyticsResponse structure
    return {
      totalSpending: analytics.reduce(
        (total: number, cat) => total + cat.amount,
        0
      ),
      categories: analytics,
      analytics: {
        numberOfCategories: analytics.length,
        averageSpendingPerCategory:
          analytics.reduce((total, cat) => total + cat.amount, 0) /
          analytics.length,
        minSpending: Math.min(...analytics.map((cat) => cat.amount)),
        maxSpending: Math.max(...analytics.map((cat) => cat.amount)),
        totalTransactions: analytics.reduce(
          (total, cat) => total + cat.transactionCount,
          0
        ),
        sumOfPercentages:
          Math.round(
            analytics.reduce((total, cat) => total + cat.percentage, 0) * 10
          ) / 10,
        standardDeviation: this.calculateStandardDeviation(
          analytics.map((cat) => cat.amount)
        ),
      },
    };
  }

  /**
   * Helper method to calculate standard deviation for spending analytics
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;

    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  /**
   * Gets spending breakdown by category for the user.
   * This is a simplified implementation that delegates to getSpendingAnalytics
   * to avoid duplicating code.
   *
   * @param userId User ID to get spending data for
   * @returns Array of category spending data
   */
  async getSpendingByCategory(
    userId: number
  ): Promise<SpendingByCategoryResponse> {
    const analytics = await this.getSpendingAnalytics(userId);
    return analytics?.categories || [];
  }

  /**
   * Gets loan obligations summary (both given and taken) for the user.
   * This is a new method that leverages the unified schema.
   *
   * @param userId User ID to get loan summary for
   * @returns Loan obligations summary with outstanding amounts
   */
  async getLoanObligationsSummary(userId: number): Promise<{
    givenLoans: number;
    takenLoans: number;
    netPosition: number;
    givenCount: number;
    takenCount: number;
  }> {
    // Get current outstanding loans from the unified schema
    const loans = await this.dashboardRepository.getTotalObligationsByType(
      userId,
      EXPENSE_SHARE_TYPE.LOAN
    );

    // We would need to add a method to count the number of loans
    // For now, we'll return a simplified version
    return {
      givenLoans: loans.given,
      takenLoans: loans.taken,
      netPosition: loans.net,
      givenCount: 0, // Would need to be implemented
      takenCount: 0, // Would need to be implemented
    };
  }

  /**
   * Gets expense shares summary (both as payer and participant) for the user.
   * This is a new method that leverages the unified schema.
   *
   * @param userId User ID to get expense shares summary for
   * @returns Expense shares summary with outstanding amounts
   */
  async getExpenseSharesSummary(userId: number): Promise<{
    asPayer: number;
    asParticipant: number;
    netPosition: number;
    payerCount: number;
    participantCount: number;
  }> {
    // Get current outstanding expense shares from the unified schema
    const expenseShares =
      await this.dashboardRepository.getTotalObligationsByType(
        userId,
        EXPENSE_SHARE_TYPE.EXPENSE
      );

    return {
      asPayer: expenseShares.given,
      asParticipant: expenseShares.taken,
      netPosition: expenseShares.net,
      payerCount: 0, // Would need to be implemented
      participantCount: 0, // Would need to be implemented
    };
  }
  async getUpcomingBills(
    userId: number,
    daysAhead?: number
  ): Promise<UpcomingBillsResponse> {
    const days = daysAhead ? parseInt(daysAhead.toString()) : 30;
    // Implementation is missing in the repository, so return empty array for now
    // This will be replaced with actual implementation later
    return []; // Return empty array matching UpcomingBillsResponse type
  }

  async getNetWorthTrend(
    userId: number,
    months?: number
  ): Promise<NetWorthTrendResponse> {
    const monthsCount = months ? parseInt(months.toString()) : 12;
    const trend = await this.dashboardRepository.getNetWorthTrend(
      userId,
      monthsCount
    );
    return trend;
  }
}

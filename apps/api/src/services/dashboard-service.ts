import { DashboardRepository } from "@/repositories/dashboard-repository";
import type {
  MonthlySummaryResponse,
  SpendingAnalyticsResponse,
  SpendingByCategoryResponse,
  UpcomingBillsResponse,
  NetWorthTrendResponse,
} from "@pocket-pixie/contracts";

export class DashboardService {
  private readonly dashboardRepository;

  constructor({
    dashboardRepository,
  }: {
    dashboardRepository: DashboardRepository;
  }) {
    this.dashboardRepository = dashboardRepository;
  }

  async getMonthlySummary(userId: number): Promise<MonthlySummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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

    const totalLoanTaken = await this.dashboardRepository.getMonthlyLoanTaken(
      userId,
      startOfMonth,
      endOfMonth
    );
    const totalLoanGiven = await this.dashboardRepository.getMonthlyLoanGiven(
      userId,
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
      totalLoanGiven,
      totalLoanTaken,
      netIncome,
      budgetUtilization,
      savingsRate,
      topExpenseCategory,
    };
  }

  async getSpendingAnalytics(
    userId: number
  ): Promise<SpendingAnalyticsResponse | null> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const analytics = await this.dashboardRepository.getSpendingAnalytics(
      userId,
      startOfMonth,
      endOfMonth
    );

    if (!analytics) {
      return null;
    }

    return analytics;
  }

  async getSpendingByCategory(
    userId: number
  ): Promise<SpendingByCategoryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categories = await this.dashboardRepository.getSpendingByCategory(
      userId,
      startOfMonth,
      endOfMonth
    );

    return categories;
  }

  async getUpcomingBills(
    userId: number,
    daysAhead?: number
  ): Promise<UpcomingBillsResponse> {
    const days = daysAhead ? parseInt(daysAhead.toString()) : 30;
    const bills = await this.dashboardRepository.getUpcomingBills(userId, days);
    return bills;
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

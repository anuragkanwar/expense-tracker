import { DashboardRepository } from "@/repositories/dashboard-repository";
// import { UserAuth } from "@/models/auth";
// import {
//   MonthlySummaryResponse,
//   SpendingByCategoryResponse,
//   UpcomingBillsResponse,
//   NetWorthTrendResponse,
//   SpendingAnalyticsResponse,
// } from "@/dto/dashboard.dto";
// import { DashboardServiceError } from "@/errors/dashboard-errors";

export class DashboardService {
  private readonly dashboardRepository;

  constructor({
    dashboardRepository,
  }: {
    dashboardRepository: DashboardRepository;
  }) {
    this.dashboardRepository = dashboardRepository;
  }
  //
  // async getMonthlySummary(user: UserAuth): Promise<MonthlySummaryResponse> {
  //   try {
  //     const userId = parseInt(user.id);
  //     const currentMonth = new Date();
  //
  //     const summary = await this.dashboardRepository.getMonthlySummary(
  //       userId,
  //       currentMonth
  //     );
  //
  //     return {
  //       month: currentMonth.toLocaleString("default", {
  //         month: "long",
  //         year: "numeric",
  //       }),
  //       totalIncome: summary.totalIncome,
  //       totalExpenses: summary.totalExpenses,
  //       netIncome: summary.netIncome,
  //       budgetUtilization: summary.budgetUtilization,
  //       savingsRate: summary.savingsRate,
  //       topExpenseCategory: summary.topExpenseCategory,
  //     };
  //   } catch (error) {
  //     throw new DashboardServiceError(
  //       "getMonthlySummary",
  //       error instanceof Error ? error.message : "Unknown error"
  //     );
  //   }
  // }
  //
  // async getSpendingByCategory(
  //   user: UserAuth
  // ): Promise<SpendingByCategoryResponse> {
  //   try {
  //     const userId = parseInt(user.id);
  //     const currentMonth = new Date();
  //
  //     return await this.dashboardRepository.getSpendingByCategory(
  //       userId,
  //       currentMonth
  //     );
  //   } catch (error) {
  //     throw new DashboardServiceError(
  //       "getSpendingByCategory",
  //       error instanceof Error ? error.message : "Unknown error"
  //     );
  //   }
  // }
  //
  // async getUpcomingBills(
  //   user: UserAuth,
  //   days: number = 30
  // ): Promise<UpcomingBillsResponse> {
  //   try {
  //     const userId = parseInt(user.id);
  //
  //     return await this.dashboardRepository.getUpcomingBills(userId, days);
  //   } catch (error) {
  //     throw new DashboardServiceError(
  //       "getUpcomingBills",
  //       error instanceof Error ? error.message : "Unknown error"
  //     );
  //   }
  // }
  //
  // async getNetWorthTrend(
  //   user: UserAuth,
  //   months: number = 12
  // ): Promise<NetWorthTrendResponse> {
  //   try {
  //     const userId = parseInt(user.id);
  //
  //     return await this.dashboardRepository.getNetWorthTrend(userId, months);
  //   } catch (error) {
  //     throw new DashboardServiceError(
  //       "getNetWorthTrend",
  //       error instanceof Error ? error.message : "Unknown error"
  //     );
  //   }
  // }
  //
  // async getSpendingAnalytics(
  //   user: UserAuth
  // ): Promise<SpendingAnalyticsResponse> {
  //   try {
  //     const userId = parseInt(user.id);
  //     const currentMonth = new Date();
  //
  //     return await this.dashboardRepository.getSpendingAnalytics(
  //       userId,
  //       currentMonth
  //     );
  //   } catch (error) {
  //     throw new DashboardServiceError(
  //       "getSpendingAnalytics",
  //       error instanceof Error ? error.message : "Unknown error"
  //     );
  //   }
  // }
}

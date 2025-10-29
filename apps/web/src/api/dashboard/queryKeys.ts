export const dashboardKeys = {
  all: ["dashboard"] as const,
  monthlySummary: () => [...dashboardKeys.all, "monthly-summary"] as const,
  spendingByCategory: () =>
    [...dashboardKeys.all, "spending-by-category"] as const,
  upcomingBills: () => [...dashboardKeys.all, "upcoming-bills"] as const,
  netWorthTrend: () => [...dashboardKeys.all, "net-worth-trend"] as const,
  spendingAnalytics: () =>
    [...dashboardKeys.all, "spending-analytics"] as const,
  loanObligations: () => [...dashboardKeys.all, "loan-obligations"] as const,
  expenseShares: () => [...dashboardKeys.all, "expense-shares"] as const,
};

import { useQuery } from "@tanstack/react-query";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import {
  MonthlySummaryResponseSchema,
  SpendingByCategoryResponseSchema,
  UpcomingBillsResponseSchema,
  NetWorthTrendResponseSchema,
  SpendingAnalyticsResponseSchema,
  buildQueryString,
} from "@pocket-pixie/contracts";

const BASE = "/api/v1/dashboard";

export function useMonthlySummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () =>
      getValidated(`${BASE}/monthly-summary`, MonthlySummaryResponseSchema),
  });
}

export function useSpendingByCategory() {
  return useQuery({
    queryKey: ["dashboard", "spending-by-category"],
    queryFn: () =>
      getValidated(
        `${BASE}/spending-by-category`,
        SpendingByCategoryResponseSchema
      ),
  });
}

export function useUpcomingBills(days?: number) {
  return useQuery({
    queryKey: ["dashboard", "upcoming-bills", days ?? "default"],
    queryFn: () =>
      getValidated(
        `${BASE}/upcoming-bills${buildQueryString({ days })}`,
        UpcomingBillsResponseSchema
      ),
  });
}

export function useNetWorthTrend(months?: number) {
  return useQuery({
    queryKey: ["dashboard", "net-worth-trend", months ?? "default"],
    queryFn: () =>
      getValidated(
        `${BASE}/net-worth-trend${buildQueryString({ months })}`,
        NetWorthTrendResponseSchema
      ),
  });
}

export function useSpendingAnalytics() {
  return useQuery({
    queryKey: ["dashboard", "spending-analytics"],
    queryFn: () =>
      getValidated(
        `${BASE}/spending-analytics`,
        SpendingAnalyticsResponseSchema
      ),
  });
}

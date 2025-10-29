import type { SpendingAnalyticsResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

export function useSpendingAnalytics() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.spendingAnalytics(),
    queryFn: async () => {
      const resp = await api.get<SpendingAnalyticsResponse>(
        "/dashboard/spending-analytics"
      );
      return resp.data;
    },
  });
}

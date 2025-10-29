import type { NetWorthTrendResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

export function useNetWorthTrend(months?: number) {
  return useSuspenseQuery({
    queryKey: dashboardKeys.netWorthTrend(),
    queryFn: async () => {
      const resp = await api.get<NetWorthTrendResponse>(
        "/dashboard/net-worth-trend",
        {
          params: { months },
        }
      );
      return resp.data;
    },
  });
}

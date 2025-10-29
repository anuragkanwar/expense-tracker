import type { MonthlySummaryResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

export function useMonthlySummary() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.monthlySummary(),
    queryFn: async () => {
      const resp = await api.get<MonthlySummaryResponse>(
        "/dashboard/monthly-summary"
      );
      return resp.data;
    },
  });
}

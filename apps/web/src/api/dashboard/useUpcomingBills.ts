import type { UpcomingBillsResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

export function useUpcomingBills(days?: number) {
  return useSuspenseQuery({
    queryKey: dashboardKeys.upcomingBills(),
    queryFn: async () => {
      const resp = await api.get<UpcomingBillsResponse>(
        "/dashboard/upcoming-bills",
        {
          params: { days },
        }
      );
      return resp.data;
    },
  });
}

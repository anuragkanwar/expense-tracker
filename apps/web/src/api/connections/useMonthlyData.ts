import type { MonthlyDataResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { connectionsKeys } from "./queryKeys";

export function useMonthlyData(year?: number, month?: number) {
  return useSuspenseQuery({
    queryKey: connectionsKeys.monthlyData(),
    queryFn: async () => {
      const resp = await api.get<MonthlyDataResponse>(
        "/connections/monthly-data",
        {
          params: { year, month },
        }
      );
      return resp.data;
    },
  });
}

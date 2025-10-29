import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { balancesKeys } from "./queryKeys";

type BalanceSummaryResponse = {
  totalOwed: number;
  totalOwe: number;
  netBalance: number;
  currency: string;
};

export function useBalanceSummary() {
  return useSuspenseQuery({
    queryKey: balancesKeys.summary(),
    queryFn: async () => {
      const resp = await api.get<BalanceSummaryResponse>("/balances");
      return resp.data;
    },
  });
}

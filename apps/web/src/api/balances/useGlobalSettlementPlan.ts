import type { SettlementPlanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { balancesKeys } from "./queryKeys";

export function useGlobalSettlementPlan() {
  return useSuspenseQuery({
    queryKey: balancesKeys.simplify(),
    queryFn: async () => {
      const resp = await api.get<SettlementPlanResponse>("/balances/simplify");
      return resp.data;
    },
  });
}

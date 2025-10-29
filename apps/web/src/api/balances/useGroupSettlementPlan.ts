import type { SettlementPlanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { balancesKeys } from "./queryKeys";

export function useGroupSettlementPlan(groupId: number) {
  return useSuspenseQuery({
    queryKey: balancesKeys.groupSimplify(groupId),
    queryFn: async () => {
      const resp = await api.get<SettlementPlanResponse>(
        `/balances/groups/${groupId}/simplify`
      );
      return resp.data;
    },
  });
}

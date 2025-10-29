import type { GroupBalancesResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useGroupBalances(groupId: number) {
  return useSuspenseQuery({
    queryKey: groupsKeys.balancesByGroup(groupId),
    queryFn: async () => {
      const resp = await api.get<GroupBalancesResponse>(
        `/groups/${groupId}/balances`
      );
      return resp.data;
    },
  });
}

import type { GroupBalancesResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { balancesKeys } from "./queryKeys";

export function useGroupBalance(groupId: number) {
  return useSuspenseQuery({
    queryKey: balancesKeys.groupBalance(groupId),
    queryFn: async () => {
      const resp = await api.get<GroupBalancesResponse>(
        `/balances/groups/${groupId}`
      );
      return resp.data;
    },
  });
}

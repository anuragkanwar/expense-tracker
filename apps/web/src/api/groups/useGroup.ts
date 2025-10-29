import type { GroupResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useGroup(groupId: number) {
  return useSuspenseQuery({
    queryKey: groupsKeys.detail(groupId),
    queryFn: async () => {
      const resp = await api.get<GroupResponse>(`/groups/${groupId}`);
      return resp.data;
    },
  });
}

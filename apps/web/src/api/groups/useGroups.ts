import type { GroupResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useGroups() {
  return useSuspenseQuery({
    queryKey: groupsKeys.list(),
    queryFn: async () => {
      const resp = await api.get<GroupResponse[]>("/groups");
      return resp.data;
    },
  });
}

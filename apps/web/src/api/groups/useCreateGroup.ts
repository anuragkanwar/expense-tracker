import type { GroupResponse, GroupCreate } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useCreateGroup() {
  return useMutation<GroupResponse, unknown, GroupCreate, unknown>({
    mutationKey: groupsKeys.all,
    mutationFn: async (data: GroupCreate) => {
      const resp = await api.post<GroupResponse>("/groups", data);
      return resp.data;
    },
  });
}

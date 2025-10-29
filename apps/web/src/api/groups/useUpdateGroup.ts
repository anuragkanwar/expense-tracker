import type { GroupResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useUpdateGroup() {
  return useMutation<
    GroupResponse,
    unknown,
    { groupId: number; data: { name?: string; coverPhotoURL?: string } },
    unknown
  >({
    mutationKey: groupsKeys.all,
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: number;
      data: { name?: string; coverPhotoURL?: string };
    }) => {
      const resp = await api.put<GroupResponse>(`/groups/${groupId}`, data);
      return resp.data;
    },
  });
}

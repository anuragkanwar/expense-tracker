import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useDeleteGroup() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: groupsKeys.all,
    mutationFn: async (groupId: number) => {
      const resp = await api.delete<MessageResponse>(`/groups/${groupId}`);
      return resp.data;
    },
  });
}

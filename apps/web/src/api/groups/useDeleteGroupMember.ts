import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

export function useDeleteGroupMember() {
  return useMutation<
    MessageResponse,
    unknown,
    { groupId: number; userId: number },
    unknown
  >({
    mutationKey: groupsKeys.all,
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: number;
      userId: number;
    }) => {
      const resp = await api.delete<MessageResponse>(
        `/groups/${groupId}/members/${userId}`
      );
      return resp.data;
    },
  });
}

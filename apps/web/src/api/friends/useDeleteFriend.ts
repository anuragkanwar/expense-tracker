import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

export function useDeleteFriend() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: friendsKeys.all,
    mutationFn: async (userId: number) => {
      const resp = await api.delete<MessageResponse>(`/friends/${userId}`);
      return resp.data;
    },
  });
}

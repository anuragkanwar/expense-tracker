import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

export function useUpdateFriendRequest() {
  return useMutation<
    MessageResponse,
    unknown,
    { userId: number; action: "accept" | "reject" },
    unknown
  >({
    mutationKey: friendsKeys.all,
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: number;
      action: "accept" | "reject";
    }) => {
      const resp = await api.put<MessageResponse>(
        `/friends/requests/${userId}`,
        { action }
      );
      return resp.data;
    },
  });
}

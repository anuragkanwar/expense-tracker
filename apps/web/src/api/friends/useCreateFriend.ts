import type {
  FriendshipResponse,
  FriendshipCreate,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

export function useCreateFriend() {
  return useMutation<FriendshipResponse, unknown, FriendshipCreate, unknown>({
    mutationKey: friendsKeys.all,
    mutationFn: async (data: FriendshipCreate) => {
      const resp = await api.post<FriendshipResponse>("/friends", data);
      return resp.data;
    },
  });
}

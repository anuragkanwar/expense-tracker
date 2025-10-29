import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

type FriendRequest = {
  id: number;
  fromUserId: number;
  fromUserName: string;
  fromUserEmail: string;
  status: string;
  createdAt: string;
};

export function useFriendRequests() {
  return useSuspenseQuery({
    queryKey: friendsKeys.requests(),
    queryFn: async () => {
      const resp = await api.get<FriendRequest[]>("/friends/requests");
      return resp.data;
    },
  });
}

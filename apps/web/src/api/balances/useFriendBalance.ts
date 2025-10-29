import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { balancesKeys } from "./queryKeys";

type FriendBalanceResponse = {
  friendId: number;
  friendName: string;
  balance: number;
  currency: string;
  lastActivity: string;
};

export function useFriendBalance(userId: number) {
  return useSuspenseQuery({
    queryKey: balancesKeys.friendBalance(userId),
    queryFn: async () => {
      const resp = await api.get<FriendBalanceResponse>(
        `/balances/friends/${userId}`
      );
      return resp.data;
    },
  });
}

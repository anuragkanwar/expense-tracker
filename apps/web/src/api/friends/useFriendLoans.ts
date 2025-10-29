import type { LoanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

type FriendLoanListResponse = {
  loans: LoanResponse[];
  total: number;
  page: number;
  limit: number;
};

export function useFriendLoans(
  friendId: number,
  page?: number,
  limit?: number
) {
  return useSuspenseQuery({
    queryKey: friendsKeys.loansByFriend(friendId),
    queryFn: async () => {
      const resp = await api.get<FriendLoanListResponse>(
        `/friends/${friendId}/loans`,
        {
          params: { page, limit },
        }
      );
      return resp.data;
    },
  });
}

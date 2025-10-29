import type { LoanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

type FriendTransactionListResponse = {
  transactions: LoanResponse[];
  total: number;
  page: number;
  limit: number;
};

export function useFriendTransactions(
  userId: number,
  page?: number,
  limit?: number
) {
  return useSuspenseQuery({
    queryKey: transactionsKeys.friendTransactions(userId),
    queryFn: async () => {
      const resp = await api.get<FriendTransactionListResponse>(
        `/transactions/friends/${userId}`,
        {
          params: { page, limit },
        }
      );
      return resp.data;
    },
  });
}

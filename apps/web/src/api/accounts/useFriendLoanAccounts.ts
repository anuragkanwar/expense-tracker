import type { TransactionAccountResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useFriendLoanAccounts(friendId: number) {
  return useSuspenseQuery({
    queryKey: accountsKeys.friendLoans(friendId),
    queryFn: async () => {
      const resp = await api.get<TransactionAccountResponse[]>(
        `/accounts/friends/${friendId}/loans`
      );
      return resp.data;
    },
  });
}

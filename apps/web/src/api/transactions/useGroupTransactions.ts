import type { TransactionListResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useGroupTransactions(
  groupId: number,
  page?: number,
  limit?: number
) {
  return useSuspenseQuery({
    queryKey: transactionsKeys.groupTransactions(groupId),
    queryFn: async () => {
      const resp = await api.get<TransactionListResponse>(
        `/transactions/groups/${groupId}`,
        {
          params: { page, limit },
        }
      );
      return resp.data;
    },
  });
}

import type { TransactionListResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useTransactions(page?: number, limit?: number, type?: string) {
  return useSuspenseQuery({
    queryKey: transactionsKeys.list({ page, limit, type }),
    queryFn: async () => {
      const resp = await api.get<TransactionListResponse>("/transactions", {
        params: { page, limit, type },
      });
      return resp.data;
    },
  });
}

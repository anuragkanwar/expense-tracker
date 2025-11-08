import type { TransactionResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

// Define the new response format based on updated contracts
interface NewTransactionListResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
}

export function useTransactions(page?: number, limit?: number, type?: string) {
  return useSuspenseQuery({
    queryKey: transactionsKeys.list({ page, limit, type }),
    queryFn: async () => {
      const resp = await api.get<NewTransactionListResponse>("/transactions", {
        params: { page, limit, type },
      });
      return resp.data;
    },
  });
}

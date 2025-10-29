import type { TransactionWithDetailsResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useTransaction(transactionId: number) {
  return useSuspenseQuery({
    queryKey: transactionsKeys.detail(transactionId),
    queryFn: async () => {
      const resp = await api.get<TransactionWithDetailsResponse>(
        `/transactions/${transactionId}`
      );
      return resp.data;
    },
  });
}

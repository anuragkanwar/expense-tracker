import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useDeleteTransaction() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: transactionsKeys.all,
    mutationFn: async (transactionId: number) => {
      const resp = await api.delete<MessageResponse>(
        `/transactions/${transactionId}`
      );
      return resp.data;
    },
  });
}

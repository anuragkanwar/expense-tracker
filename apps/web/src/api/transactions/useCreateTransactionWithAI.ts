import type {
  TransactionWithDetailsResponse,
  TransactionCreateWithAIPrompt,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useCreateTransactionWithAI() {
  return useMutation<
    TransactionWithDetailsResponse,
    unknown,
    TransactionCreateWithAIPrompt,
    unknown
  >({
    mutationKey: transactionsKeys.all,
    mutationFn: async (data: TransactionCreateWithAIPrompt) => {
      const resp = await api.post<TransactionWithDetailsResponse>(
        "/transactions/ai",
        data
      );
      return resp.data;
    },
  });
}

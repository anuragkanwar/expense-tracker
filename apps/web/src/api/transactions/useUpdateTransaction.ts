import type {
  TransactionWithDetailsResponse,
  TransactionUpdateWithDetails,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useUpdateTransaction() {
  return useMutation<
    TransactionWithDetailsResponse,
    unknown,
    { transactionId: number; data: TransactionUpdateWithDetails },
    unknown
  >({
    mutationKey: transactionsKeys.all,
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: number;
      data: TransactionUpdateWithDetails;
    }) => {
      const resp = await api.put<TransactionWithDetailsResponse>(
        `/transactions/${transactionId}`,
        data
      );
      return resp.data;
    },
  });
}

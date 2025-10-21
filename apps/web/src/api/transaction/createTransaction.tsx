import type { TransactionCreateWithDetails } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { CREATE_TRANSACTION } from "./queryKeys";

export function useCreateTransaction() {
  return useMutation({
    mutationKey: CREATE_TRANSACTION,
    mutationFn: async (data: TransactionCreateWithDetails) => {
      // return api.post("/transactions", data);
      console.log(data);
      return Promise.resolve(() => data);
    },
  });
}

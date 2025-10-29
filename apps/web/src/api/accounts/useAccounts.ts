import type { TransactionAccountResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useAccounts() {
  return useSuspenseQuery({
    queryKey: accountsKeys.list(),
    queryFn: async () => {
      const resp = await api.get<TransactionAccountResponse[]>("/accounts");
      return resp.data;
    },
  });
}

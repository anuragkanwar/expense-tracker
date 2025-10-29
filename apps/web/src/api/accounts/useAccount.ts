import type { TransactionAccountResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useAccount(accountId: number) {
  return useSuspenseQuery({
    queryKey: accountsKeys.detail(accountId),
    queryFn: async () => {
      const resp = await api.get<TransactionAccountResponse>(
        `/accounts/${accountId}`
      );
      return resp.data;
    },
  });
}

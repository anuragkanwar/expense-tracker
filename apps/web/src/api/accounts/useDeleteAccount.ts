import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useDeleteAccount() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: accountsKeys.all,
    mutationFn: async (accountId: number) => {
      const resp = await api.delete<MessageResponse>(`/accounts/${accountId}`);
      return resp.data;
    },
  });
}

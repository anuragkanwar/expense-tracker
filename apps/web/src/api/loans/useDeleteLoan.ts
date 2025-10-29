import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { loansKeys } from "./queryKeys";

export function useDeleteLoan() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: loansKeys.all,
    mutationFn: async (loanId: number) => {
      const resp = await api.delete<MessageResponse>(`/loans/${loanId}`);
      return resp.data;
    },
  });
}

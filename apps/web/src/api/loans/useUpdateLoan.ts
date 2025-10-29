import type { LoanResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { loansKeys } from "./queryKeys";

export function useUpdateLoan() {
  return useMutation<
    LoanResponse,
    unknown,
    {
      loanId: number;
      data: {
        description?: string;
        amount?: number;
        currency?: string;
        loanDate?: string;
      };
    },
    unknown
  >({
    mutationKey: loansKeys.all,
    mutationFn: async ({
      loanId,
      data,
    }: {
      loanId: number;
      data: {
        description?: string;
        amount?: number;
        currency?: string;
        loanDate?: string;
      };
    }) => {
      const resp = await api.put<LoanResponse>(`/loans/${loanId}`, data);
      return resp.data;
    },
  });
}

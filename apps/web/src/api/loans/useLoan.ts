import type { LoanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { loansKeys } from "./queryKeys";

export function useLoan(loanId: number) {
  return useSuspenseQuery({
    queryKey: loansKeys.detail(loanId),
    queryFn: async () => {
      const resp = await api.get<LoanResponse>(`/loans/${loanId}`);
      return resp.data;
    },
  });
}

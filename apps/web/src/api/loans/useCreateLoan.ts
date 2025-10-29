import type { LoanResponse, LoanCreate } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { loansKeys } from "./queryKeys";

export function useCreateLoan() {
  return useMutation<LoanResponse, unknown, LoanCreate, unknown>({
    mutationKey: loansKeys.all,
    mutationFn: async (data: LoanCreate) => {
      const resp = await api.post<LoanResponse>("/loans", data);
      return resp.data;
    },
  });
}

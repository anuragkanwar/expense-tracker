import type { LoanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { loansKeys } from "./queryKeys";

type LoanListResponse = {
  loans: LoanResponse[];
  total: number;
  page: number;
  limit: number;
};

export function useLoans(
  page?: number,
  limit?: number,
  type?: "given" | "taken" | "all"
) {
  return useSuspenseQuery({
    queryKey: loansKeys.list({ page, limit, type }),
    queryFn: async () => {
      const resp = await api.get<LoanListResponse>("/loans", {
        params: { page, limit, type },
      });
      return resp.data;
    },
  });
}

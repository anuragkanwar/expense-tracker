import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

type LoanObligationsSummaryResponse = {
  givenLoans: number;
  takenLoans: number;
  netPosition: number;
  givenCount: number;
  takenCount: number;
};

export function useLoanObligationsSummary() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.loanObligations(),
    queryFn: async () => {
      const resp = await api.get<LoanObligationsSummaryResponse>(
        "/dashboard/loan-obligations"
      );
      return resp.data;
    },
  });
}

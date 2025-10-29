import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

type ExpenseSharesSummaryResponse = {
  asPayer: number;
  asParticipant: number;
  netPosition: number;
  payerCount: number;
  participantCount: number;
};

export function useExpenseSharesSummary() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.expenseShares(),
    queryFn: async () => {
      const resp = await api.get<ExpenseSharesSummaryResponse>(
        "/dashboard/expense-shares"
      );
      return resp.data;
    },
  });
}

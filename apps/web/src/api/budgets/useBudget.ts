import type { BudgetWithStatusResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { budgetsKeys } from "./queryKeys";

export function useBudget(budgetId: number) {
  return useSuspenseQuery({
    queryKey: budgetsKeys.detail(budgetId),
    queryFn: async () => {
      const resp = await api.get<BudgetWithStatusResponse>(
        `/budgets/budgets/${budgetId}`
      );
      return resp.data;
    },
  });
}

import type { BudgetWithStatusResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { budgetsKeys } from "./queryKeys";

export function useBudgets() {
  return useSuspenseQuery({
    queryKey: budgetsKeys.list(),
    queryFn: async () => {
      const resp =
        await api.get<BudgetWithStatusResponse[]>("/budgets/budgets");
      return resp.data;
    },
  });
}

import type { BudgetResponse, BudgetUpdate } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { budgetsKeys } from "./queryKeys";

export function useUpdateBudget() {
  return useMutation<
    BudgetResponse,
    unknown,
    { budgetId: number; data: BudgetUpdate },
    unknown
  >({
    mutationKey: budgetsKeys.all,
    mutationFn: async ({
      budgetId,
      data,
    }: {
      budgetId: number;
      data: BudgetUpdate;
    }) => {
      const resp = await api.put<BudgetResponse>(
        `/budgets/budgets/${budgetId}`,
        data
      );
      return resp.data;
    },
  });
}

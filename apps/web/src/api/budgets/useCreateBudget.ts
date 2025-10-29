import type { BudgetResponse, BudgetCreate } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { budgetsKeys } from "./queryKeys";

export function useCreateBudget() {
  return useMutation<BudgetResponse, unknown, BudgetCreate, unknown>({
    mutationKey: budgetsKeys.all,
    mutationFn: async (data: BudgetCreate) => {
      const resp = await api.post<BudgetResponse>("/budgets/budgets", data);
      return resp.data;
    },
  });
}

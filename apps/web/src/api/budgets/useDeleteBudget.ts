import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { budgetsKeys } from "./queryKeys";

export function useDeleteBudget() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: budgetsKeys.all,
    mutationFn: async (budgetId: number) => {
      const resp = await api.delete<MessageResponse>(
        `/budgets/budgets/${budgetId}`
      );
      return resp.data;
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import { z } from "@hono/zod-openapi";
import {
  BudgetWithStatusResponseSchema,
  BudgetResponseSchema,
  BudgetCreateSchema,
} from "@pocket-pixie/contracts";

export type BudgetWithStatus = z.infer<typeof BudgetWithStatusResponseSchema>;
export type Budget = z.infer<typeof BudgetResponseSchema>;
export type BudgetCreateInput = z.infer<typeof BudgetCreateSchema>;

const BASE = "/api/v1/budgets";

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.list(),
    queryFn: () => getValidated(BASE, BudgetWithStatusResponseSchema.array()),
  });
}

export function useBudget(budgetId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.budgets.detail(budgetId),
    queryFn: () =>
      getValidated(`${BASE}/${budgetId}`, BudgetWithStatusResponseSchema),
    enabled: Boolean(budgetId) && enabled,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetCreateInput) => {
      const res = await apiClient.post(BASE, input);
      return BudgetResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.list() });
    },
  });
}

export function useUpdateBudget(budgetId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BudgetCreateInput>) => {
      const res = await apiClient.put(`${BASE}/${budgetId}`, input);
      return BudgetResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.list() });
      qc.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) });
      if (data) {
        qc.setQueryData(queryKeys.budgets.detail(budgetId), data);
      }
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: number | string) => {
      await apiClient.delete(`${BASE}/${budgetId}`);
    },
    onSuccess: (_data, budgetId) => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.list() });
      qc.removeQueries({ queryKey: queryKeys.budgets.detail(budgetId) });
    },
  });
}

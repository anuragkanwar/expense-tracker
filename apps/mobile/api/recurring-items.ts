import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";

import { z } from "@hono/zod-openapi";

import {
  RecurringResponseSchema,
  RecurringItemCreateSchema,
} from "@pocket-pixie/contracts";

export type RecurringResponse = z.infer<typeof RecurringResponseSchema>;
export type RecurringItemCreate = z.infer<typeof RecurringItemCreateSchema>;

const BASE = "/api/v1/recurring-items";

export function useRecurringItems() {
  return useQuery({
    queryKey: queryKeys.recurringItems.list(),
    queryFn: () => getValidated(BASE, RecurringResponseSchema.array()),
  });
}

export function useRecurringItem(itemId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.recurringItems.detail(itemId),
    queryFn: () => getValidated(`${BASE}/${itemId}`, RecurringResponseSchema),
    enabled: Boolean(itemId) && enabled,
  });
}

export function useCreateRecurringItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecurringItemCreate) => {
      const res = await apiClient.post(BASE, input);
      return RecurringResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurringItems.list() });
    },
  });
}

export function useUpdateRecurringItem(itemId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<RecurringItemCreate>) => {
      const res = await apiClient.put(`${BASE}/${itemId}`, input);
      return RecurringResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.recurringItems.list() });
      qc.invalidateQueries({
        queryKey: queryKeys.recurringItems.detail(itemId),
      });
      if (data) {
        qc.setQueryData(queryKeys.recurringItems.detail(itemId), data);
      }
    },
  });
}

export function useDeleteRecurringItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number | string) => {
      await apiClient.delete(`${BASE}/${itemId}`);
    },
    onSuccess: (_data, itemId) => {
      qc.invalidateQueries({ queryKey: queryKeys.recurringItems.list() });
      qc.removeQueries({ queryKey: queryKeys.recurringItems.detail(itemId) });
    },
  });
}

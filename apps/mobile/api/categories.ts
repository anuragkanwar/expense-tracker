import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { z } from "@hono/zod-openapi";

import {
  CategoryCreateSchema,
  CategoryResponseSchema,
} from "@pocket-pixie/contracts";

export type Category = z.infer<typeof CategoryResponseSchema>;
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

const BASE = "/api/v1/categories";

async function getValidated<T>(
  url: string,
  schema: { parse: (d: unknown) => T }
): Promise<T> {
  const res = await apiClient.get(url);
  return schema.parse(res.data);
}

// List categories
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => getValidated(BASE, CategoryResponseSchema.array()),
  });
}

// Single category detail
export function useCategory(
  categoryId: number | string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId ?? "unknown"),
    enabled: Boolean(categoryId) && enabled,
    queryFn: () =>
      getValidated(`${BASE}/${categoryId}`, CategoryResponseSchema),
  });
}

// Create category
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryCreateInput) => {
      const res = await apiClient.post(BASE, input);
      return CategoryResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
    },
  });
}

// Update category
export function useUpdateCategory(categoryId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CategoryCreateInput>) => {
      const res = await apiClient.put(`${BASE}/${categoryId}`, input);
      return CategoryResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
      qc.invalidateQueries({
        queryKey: queryKeys.categories.detail(categoryId),
      });
      if (data) {
        qc.setQueryData(queryKeys.categories.detail(categoryId), data);
      }
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: number | string) => {
      await apiClient.delete(`${BASE}/${categoryId}`);
    },
    onSuccess: (_data, categoryId) => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.list() });
      qc.removeQueries({ queryKey: queryKeys.categories.detail(categoryId) });
    },
  });
}

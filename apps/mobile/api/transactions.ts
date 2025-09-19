import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import { z } from "@hono/zod-openapi";

import {
  TransactionResponseSchema,
  TransactionCreateSchema,
  TransactionUpdateSchema,
  TransactionCreateWithAIPromptSchema,
  TransactionWithDetailsResponseSchema,
  buildQueryString,
} from "@pocket-pixie/contracts";

export type Transaction = z.infer<typeof TransactionResponseSchema>;
export type TransactionCreateInput = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof TransactionUpdateSchema>;

const BASE = "/api/v1/transactions";

// Generic list (supports filters via query keys already)
export function useTransactions(filters?: {
  page?: number;
  limit?: number;
  type?: string;
}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () =>
      getValidated(
        `${BASE}` +
          buildQueryString({
            page: filters?.page,
            limit: filters?.limit,
            type: filters?.type,
          }),
        TransactionResponseSchema.array()
      ),
  });
}

// Group transactions
export function useGroupTransactions(
  groupId: number | string,
  page?: number,
  limit?: number,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.transactions.group(groupId, page, limit),
    queryFn: () =>
      getValidated(
        `${BASE}/groups/${groupId}` + buildQueryString({ page, limit }),
        TransactionResponseSchema.array()
      ),
    enabled: Boolean(groupId) && enabled,
  });
}

// Friend transactions
export function useFriendTransactions(
  userId: number | string,
  page?: number,
  limit?: number,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.transactions.friend(userId, page, limit),
    queryFn: () =>
      getValidated(
        `${BASE}/friends/${userId}` + buildQueryString({ page, limit }),
        TransactionResponseSchema.array()
      ),
    enabled: Boolean(userId) && enabled,
  });
}

// Single transaction
export function useTransaction(transactionId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(transactionId),
    queryFn: () =>
      getValidated(`${BASE}/${transactionId}`, TransactionResponseSchema),
    enabled: Boolean(transactionId) && enabled,
  });
}

// Create
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionCreateInput) => {
      const res = await apiClient.post(BASE, input);
      return TransactionResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

// Update
export function useUpdateTransaction(transactionId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionUpdateInput) => {
      const res = await apiClient.put(`${BASE}/${transactionId}`, input);
      return TransactionResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      if (data) {
        qc.setQueryData(queryKeys.transactions.detail(transactionId), data);
      }
    },
  });
}

// Delete
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: number | string) => {
      await apiClient.delete(`${BASE}/${transactionId}`);
      return { id: transactionId };
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      qc.removeQueries({ queryKey: queryKeys.transactions.detail(id) });
    },
  });
}

// Create transaction via AI prompt

export type TransactionCreateWithAIPrompt = z.infer<
  typeof TransactionCreateWithAIPromptSchema
>;
export type TransactionWithDetailsResponse = z.infer<
  typeof TransactionWithDetailsResponseSchema
>;

export function useCreateTransactionWithAI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionCreateWithAIPrompt) => {
      const res = await apiClient.post(`${BASE}/ai`, input);
      return TransactionWithDetailsResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

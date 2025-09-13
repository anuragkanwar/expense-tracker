import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";

import { z } from "@hono/zod-openapi";
import {
  TransactionAccountResponseSchema,
  TransactionAccountCreateSchema,
  TransactionAccountUpdateSchema,
} from "@pocket-pixie/contracts";

export type TransactionAccount = z.infer<
  typeof TransactionAccountResponseSchema
>;
export type TransactionAccountCreateInput = z.infer<
  typeof TransactionAccountCreateSchema
>;
export type TransactionAccountUpdateInput = z.infer<
  typeof TransactionAccountUpdateSchema
>;

const BASE = "/api/v1/transaction-accounts";

// List all user's transaction accounts
export function useTransactionAccounts() {
  return useQuery({
    queryKey: queryKeys.transactionAccounts.list(),
    queryFn: () => getValidated(BASE, TransactionAccountResponseSchema.array()),
  });
}

// Get single account by id
export function useTransactionAccount(
  accountId: number | string,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.transactionAccounts.detail(accountId),
    queryFn: () =>
      getValidated(`${BASE}/${accountId}`, TransactionAccountResponseSchema),
    enabled: Boolean(accountId) && enabled,
  });
}

// Get special account by type (EXTERNAL, OUTGOING, LOAN_GIVEN, LOAN_TAKEN, INCOME, SAVING)
export function useSpecialTransactionAccount(type: string, enabled = true) {
  return useQuery({
    queryKey: ["transaction-accounts", "special", type],
    queryFn: () =>
      getValidated(
        `${BASE}/special/${type}`,
        TransactionAccountResponseSchema.nullable()
      ),
    enabled: Boolean(type) && enabled,
  });
}

// Get friend's loan accounts
export function useFriendLoanTransactionAccounts(
  friendId: number | string,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.transactionAccounts.friendLoans(friendId),
    queryFn: () =>
      getValidated(
        `${BASE}/friends/${friendId}/loans`,
        TransactionAccountResponseSchema.array()
      ),
    enabled: Boolean(friendId) && enabled,
  });
}

// Create account
export function useCreateTransactionAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionAccountCreateInput) => {
      const res = await apiClient.post(BASE, input);
      return TransactionAccountResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transaction-accounts"] });
    },
  });
}

// Update account
export function useUpdateTransactionAccount(accountId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionAccountUpdateInput) => {
      const res = await apiClient.put(`${BASE}/${accountId}`, input);
      return TransactionAccountResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["transaction-accounts"] });
      if (data) {
        qc.setQueryData(queryKeys.transactionAccounts.detail(accountId), data);
      }
    },
  });
}

// Delete account
export function useDeleteTransactionAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: number | string) => {
      await apiClient.delete(`${BASE}/${accountId}`);
      return { id: accountId };
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["transaction-accounts"] });
      qc.removeQueries({ queryKey: queryKeys.transactionAccounts.detail(id) });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import { z } from "@hono/zod-openapi";
import {
  TransactionAccountResponseSchema,
  TransactionAccountCreateSchema,
} from "@pocket-pixie/contracts";

export type Account = z.infer<typeof TransactionAccountResponseSchema>;
export type AccountCreateInput = z.infer<typeof TransactionAccountCreateSchema>;

const BASE = "/api/v1/accounts";

// List all user's accounts
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => getValidated(BASE, TransactionAccountResponseSchema.array()),
  });
}

// Get single account by id
export function useAccount(accountId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () =>
      getValidated(`${BASE}/${accountId}`, TransactionAccountResponseSchema),
    enabled: Boolean(accountId) && enabled,
  });
}

// Create account
export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountCreateInput) => {
      const res = await apiClient.post(BASE, input);
      return TransactionAccountResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.list() });
    },
  });
}

// Update account
export function useUpdateAccount(accountId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AccountCreateInput>) => {
      const res = await apiClient.put(`${BASE}/${accountId}`, input);
      return TransactionAccountResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.list() });
      if (data) {
        qc.setQueryData(queryKeys.accounts.detail(accountId), data);
      }
    },
  });
}

// Delete account
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: number | string) => {
      await apiClient.delete(`${BASE}/${accountId}`);
      return { id: accountId };
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.list() });
      qc.removeQueries({ queryKey: queryKeys.accounts.detail(id) });
    },
  });
}

// Get special account by type
export function useSpecialAccount(type: string, enabled = true) {
  return useQuery({
    queryKey: ["accounts", "special", type],
    queryFn: () =>
      getValidated(
        `${BASE}/special/${type}`,
        TransactionAccountResponseSchema.nullable()
      ),
    enabled: Boolean(type) && enabled,
  });
}

// Get friend's loan accounts
export function useFriendLoanAccounts(
  friendId: number | string,
  enabled = true
) {
  return useQuery({
    queryKey: ["accounts", "friend-loans", friendId],
    queryFn: () =>
      getValidated(
        `${BASE}/friends/${friendId}/loans`,
        TransactionAccountResponseSchema.array()
      ),
    enabled: Boolean(friendId) && enabled,
  });
}

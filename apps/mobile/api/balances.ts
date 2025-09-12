import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  BalancesSettlementPlanResponseSchema,
  SettlementCreateSchema,
} from "@pocket-pixie/contracts";
import { z } from "@hono/zod-openapi";

export type BalanceSummary = z.infer<typeof BalanceSummaryResponseSchema>;
export type FriendBalance = z.infer<typeof FriendBalanceResponseSchema>;
export type GroupBalance = z.infer<typeof GroupBalanceResponseSchema>;
export type GlobalSettlementPlan = z.infer<
  typeof BalancesSettlementPlanResponseSchema
>;
export type SettlementCreateInput = z.infer<typeof SettlementCreateSchema>;

const BASE = "/api/v1/balances";

export function useBalanceSummary() {
  return useQuery({
    queryKey: queryKeys.balances.summary(),
    queryFn: () => getValidated(BASE, BalanceSummaryResponseSchema),
  });
}

export function useFriendBalance(userId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.balances.friend(userId),
    queryFn: () =>
      getValidated(`${BASE}/friends/${userId}`, FriendBalanceResponseSchema),
    enabled: Boolean(userId) && enabled,
  });
}

export function useGroupBalance(groupId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.balances.group(groupId),
    queryFn: () =>
      getValidated(`${BASE}/groups/${groupId}`, GroupBalanceResponseSchema),
    enabled: Boolean(groupId) && enabled,
  });
}

export function useGlobalSettlementPlan(enabled = true) {
  return useQuery({
    queryKey: queryKeys.balances.simplify(),
    queryFn: () =>
      getValidated(`${BASE}/simplify`, BalancesSettlementPlanResponseSchema),
    enabled,
  });
}

export function useGroupSettlementPlan(
  groupId: number | string,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.balances.groupSimplify(groupId),
    queryFn: () =>
      getValidated(
        `${BASE}/groups/${groupId}/simplify`,
        BalancesSettlementPlanResponseSchema
      ),
    enabled: Boolean(groupId) && enabled,
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SettlementCreateInput) => {
      const res = await apiClient.post(`${BASE}`, input);
      return res.data as { message?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries(); // broad, adjust if too aggressive
    },
  });
}

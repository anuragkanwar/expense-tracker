import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated, sendValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import {
  GroupCreateSchema,
  GroupResponseSchema,
  GroupUpdateSchema,
  GroupMemberBulkResponseSchema,
  GroupMemberBulkCreateSchema,
  GroupMemberCreateSchema,
  GroupBalancesResponseSchema,
  SettlementPlanResponseSchema,
 GroupMemberSchema } from "@pocket-pixie/contracts";

import { z } from "@hono/zod-openapi";


export type Group = z.infer<typeof GroupResponseSchema>;
export type CreateGroupInput = z.infer<typeof GroupCreateSchema>;
export type UpdateGroupInput = z.infer<typeof GroupUpdateSchema>;
export type GroupMemberBulkResponse = z.infer<
  typeof GroupMemberBulkResponseSchema
>;
export type AddMemberBulkInput = z.infer<typeof GroupMemberBulkCreateSchema>;
export type AddMemberSingleInput = z.infer<typeof GroupMemberCreateSchema>;
export type GroupBalances = z.infer<typeof GroupBalancesResponseSchema>;
export type SettlementPlan = z.infer<typeof SettlementPlanResponseSchema>;

const API_BASE = "/api/v1/groups"; // maintain single source for path

// List groups
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => getValidated(API_BASE, GroupResponseSchema.array()),
  });
}

// Group detail
export function useGroup(groupId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => getValidated(`${API_BASE}/${groupId}`, GroupResponseSchema),
    enabled: Boolean(groupId) && enabled,
  });
}

// Create group
export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      // server sets createdBy
      return await sendValidated("post", API_BASE, input, GroupResponseSchema);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
  });
}

// Update group
export function useUpdateGroup(groupId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGroupInput) => {
      return await sendValidated(
        "put",
        `${API_BASE}/${groupId}`,
        input,
        GroupResponseSchema
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.list() });
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      if (data) {
        // optimistic cache update for detail if present
        qc.setQueryData(queryKeys.groups.detail(groupId), data);
      }
    },
  });
}

// Delete group
export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number | string) => {
      await sendValidated("delete", `${API_BASE}/${groupId}`);
    },
    onSuccess: (_data, groupId) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.list() });
      qc.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
    },
  });
}

// Members list
export function useGroupMembers(groupId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: async () => {
      const res = await apiClient.get(`${API_BASE}/${groupId}/members`);
      return GroupMemberSchema.array().parse(res.data);
    },
    enabled: Boolean(groupId) && enabled,
  });
}

// Add members (single or bulk)
export function useAddGroupMembers(groupId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddMemberSingleInput | AddMemberBulkInput) => {
      const res = await apiClient.post(`${API_BASE}/${groupId}/members`, input);
      return res.data as { message?: string } | GroupMemberBulkResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });
}

// Remove member
export function useRemoveGroupMember(groupId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`${API_BASE}/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });
}

// Group balances
export function useGroupBalances(groupId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.balances(groupId),
    queryFn: () =>
      getValidated(
        `${API_BASE}/${groupId}/balances`,
        GroupBalancesResponseSchema
      ),
    enabled: Boolean(groupId) && enabled,
  });
}

// Settlement plan
export function useSettlementPlan(groupId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.settlementPlan(groupId),
    queryFn: () =>
      getValidated(
        `${API_BASE}/${groupId}/settlement-plan`,
        SettlementPlanResponseSchema
      ),
    enabled: Boolean(groupId) && enabled,
  });
}

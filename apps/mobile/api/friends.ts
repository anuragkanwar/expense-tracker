import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";

import { z } from "@hono/zod-openapi";

import {
  UserResponseSchema,
  FriendshipResponseSchema,
  FriendRequestSchema,
} from "@pocket-pixie/contracts";

// Types
export type FriendUser = z.infer<typeof UserResponseSchema>;
export type Friendship = z.infer<typeof FriendshipResponseSchema>;

const BASE = "/api/v1/friends";

// List accepted friends
export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: () => getValidated(BASE, UserResponseSchema.array()),
  });
}

// Pending incoming requests
export function useFriendRequests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.friends.requests(),
    queryFn: () =>
      getValidated(`${BASE}/requests`, FriendRequestSchema.array()),
    enabled,
  });
}

// Send friend request
export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: number) => {
      const res = await apiClient.post(BASE, { friendId });
      return FriendshipResponseSchema.parse(res.data);
    },
    onSuccess: () => {
      // Refresh pending requests (if user is recipient) - though sender won't see it there
      qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
    },
  });
}

// Respond to incoming friend request (accept or reject)
export function useRespondToFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fromUserId: number;
      action: "accept" | "reject";
    }) => {
      const { fromUserId, action } = params;
      const res = await apiClient.put(`${BASE}/requests/${fromUserId}`, {
        action,
      });
      return res.data as { message: string; friendship?: Friendship };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
      if (data?.friendship) {
        // Accepted: refresh friend list
        qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
      }
    },
  });
}

// Remove friend OR cancel own pending request / reject received pending request
export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiClient.delete(`${BASE}/${userId}`);
      return res.data as { message: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.friends.list() });
      qc.invalidateQueries({ queryKey: queryKeys.friends.requests() });
    },
  });
}

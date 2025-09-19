import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import { z } from "@hono/zod-openapi";

import {
  LinkTokenRequestSchema,
  LinkTokenResponseSchema,
  SyncRequestSchema,
  SyncResponseSchema,
  MonthlyDataRequestSchema,
  MonthlyDataResponseSchema,
  buildQueryString,
} from "@pocket-pixie/contracts";

export type LinkTokenRequest = z.infer<typeof LinkTokenRequestSchema>;
export type LinkTokenResponse = z.infer<typeof LinkTokenResponseSchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
export type MonthlyDataRequest = z.infer<typeof MonthlyDataRequestSchema>;
export type MonthlyDataResponse = z.infer<typeof MonthlyDataResponseSchema>;

const BASE = "/api/v1/connections";

// Generate link token
export function useCreateLinkToken() {
  return useMutation({
    mutationFn: async (input: LinkTokenRequest) => {
      const res = await apiClient.post(`${BASE}/link-token`, input);
      return LinkTokenResponseSchema.parse(res.data);
    },
  });
}

// Trigger sync
export function useSyncConnections() {
  return useMutation({
    mutationFn: async (input: SyncRequest) => {
      const res = await apiClient.post(`${BASE}/sync`, input);
      return SyncResponseSchema.parse(res.data);
    },
  });
}

// Monthly aggregated data (cached by year & month)
export function useMonthlyConnectionData(params?: MonthlyDataRequest) {
  const { year, month } = params || {};
  return useQuery({
    queryKey: queryKeys.connections.detail(
      `${year ?? "current"}-${month ?? "current"}`
    ),
    queryFn: () =>
      getValidated(
        `${BASE}/monthly-data${buildQueryString({ year, month })}`,
        MonthlyDataResponseSchema
      ),
  });
}

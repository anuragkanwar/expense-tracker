import type { SyncResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { connectionsKeys } from "./queryKeys";

type SyncConnectionsVariables = {
  accountIds?: string[];
  fullSync?: boolean;
};

export function useSyncConnections() {
  return useMutation<
    SyncResponse,
    unknown,
    SyncConnectionsVariables | undefined,
    unknown
  >({
    mutationKey: connectionsKeys.all,
    mutationFn: async (data?: SyncConnectionsVariables) => {
      const resp = await api.post<SyncResponse>("/connections/sync", data);
      return resp.data;
    },
  });
}

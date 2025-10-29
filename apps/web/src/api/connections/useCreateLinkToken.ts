import type {
  LinkTokenResponse,
  LinkTokenRequest,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { connectionsKeys } from "./queryKeys";

export function useCreateLinkToken() {
  return useMutation<LinkTokenResponse, unknown, LinkTokenRequest, unknown>({
    mutationKey: connectionsKeys.all,
    mutationFn: async (data: LinkTokenRequest) => {
      const resp = await api.post<LinkTokenResponse>(
        "/connections/link-token",
        data
      );
      return resp.data;
    },
  });
}

import type { UserResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { friendsKeys } from "./queryKeys";

export function useFriends() {
  return useSuspenseQuery({
    queryKey: friendsKeys.list(),
    queryFn: async () => {
      const resp = await api.get<UserResponse[]>("/friends");
      return resp.data;
    },
  });
}

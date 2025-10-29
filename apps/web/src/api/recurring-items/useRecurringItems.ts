import type { RecurringResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { recurringItemsKeys } from "./queryKeys";

export function useRecurringItems() {
  return useSuspenseQuery({
    queryKey: recurringItemsKeys.list(),
    queryFn: async () => {
      const resp = await api.get<RecurringResponse[]>("/recurring-items");
      return resp.data;
    },
  });
}

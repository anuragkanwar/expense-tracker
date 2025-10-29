import type { RecurringResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { recurringItemsKeys } from "./queryKeys";

export function useRecurringItem(itemId: number) {
  return useSuspenseQuery({
    queryKey: recurringItemsKeys.detail(itemId),
    queryFn: async () => {
      const resp = await api.get<RecurringResponse>(
        `/recurring-items/${itemId}`
      );
      return resp.data;
    },
  });
}

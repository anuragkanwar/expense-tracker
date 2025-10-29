import type {
  RecurringResponse,
  RecurringUpdate,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { recurringItemsKeys } from "./queryKeys";

export function useUpdateRecurringItem() {
  return useMutation<
    RecurringResponse,
    unknown,
    { itemId: number; data: RecurringUpdate },
    unknown
  >({
    mutationKey: recurringItemsKeys.all,
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: number;
      data: RecurringUpdate;
    }) => {
      const resp = await api.put<RecurringResponse>(
        `/recurring-items/${itemId}`,
        data
      );
      return resp.data;
    },
  });
}

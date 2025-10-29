import type { MessageResponse } from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { recurringItemsKeys } from "./queryKeys";

export function useDeleteRecurringItem() {
  return useMutation<MessageResponse, unknown, number, unknown>({
    mutationKey: recurringItemsKeys.all,
    mutationFn: async (itemId: number) => {
      const resp = await api.delete<MessageResponse>(
        `/recurring-items/${itemId}`
      );
      return resp.data;
    },
  });
}

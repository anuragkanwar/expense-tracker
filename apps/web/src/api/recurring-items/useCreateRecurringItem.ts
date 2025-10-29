import type {
  RecurringResponse,
  RecurringCreate,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { recurringItemsKeys } from "./queryKeys";

export function useCreateRecurringItem() {
  return useMutation<RecurringResponse, unknown, RecurringCreate, unknown>({
    mutationKey: recurringItemsKeys.all,
    mutationFn: async (data: RecurringCreate) => {
      const resp = await api.post<RecurringResponse>("/recurring-items", data);
      return resp.data;
    },
  });
}

import type { PassbookResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { passbookKeys } from "./queryKeys";

export function usePassbook(params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  accountId?: number;
  entryType?: "transaction" | "expense" | "loan" | "all";
  status?: "unpaid" | "partially_paid" | "paid" | "all";
}) {
  return useSuspenseQuery({
    queryKey: passbookKeys.list(params),
    queryFn: async () => {
      const resp = await api.get<PassbookResponse>("/passbook/passbook", {
        params,
      });
      return resp.data;
    },
  });
}

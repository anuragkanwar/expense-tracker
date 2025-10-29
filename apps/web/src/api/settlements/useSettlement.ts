import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { settlementsKeys } from "./queryKeys";

type SettlementResponse = {
  id: number;
  payerId: number;
  payeeId: number;
  amount: number;
  currency: string;
  groupId?: number;
  transactionId?: number;
  settledAt: string;
  createdAt: string;
  updatedAt: string;
};

export function useSettlement(id: string) {
  return useSuspenseQuery({
    queryKey: settlementsKeys.detail(id),
    queryFn: async () => {
      const resp = await api.get<SettlementResponse>(`/settlements/${id}`);
      return resp.data;
    },
  });
}

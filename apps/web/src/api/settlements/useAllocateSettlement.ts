import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { settlementsKeys } from "./queryKeys";

type SettlementAllocationResponse = {
  settlement: {
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
  applications: Array<{
    id: number;
    settlementId: number;
    expenseShareId: number;
    appliedAmount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  totalApplied: number;
  outstandingBefore: number;
  outstandingAfter: number;
};

type AllocateSettlementVariables = {
  data: {
    payeeId: number;
    amount: number;
    currency: string;
    groupId?: number;
    type?: "EXPENSE" | "LOAN";
  };
  idempotencyKey: string;
};

export function useAllocateSettlement() {
  return useMutation<
    SettlementAllocationResponse,
    unknown,
    AllocateSettlementVariables,
    unknown
  >({
    mutationKey: settlementsKeys.all,
    mutationFn: async (variables: AllocateSettlementVariables) => {
      const resp = await api.post<SettlementAllocationResponse>(
        "/settlements/allocate",
        variables.data,
        {
          headers: { "Idempotency-Key": variables.idempotencyKey },
        }
      );
      return resp.data;
    },
  });
}

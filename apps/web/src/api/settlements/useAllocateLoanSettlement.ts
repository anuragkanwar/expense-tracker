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

type AllocateLoanSettlementVariables = {
  data: {
    payeeId: number;
    amount: number;
    currency: string;
    groupId?: number;
  };
  idempotencyKey: string;
};

export function useAllocateLoanSettlement() {
  return useMutation<
    SettlementAllocationResponse,
    unknown,
    AllocateLoanSettlementVariables,
    unknown
  >({
    mutationKey: settlementsKeys.all,
    mutationFn: async (variables: AllocateLoanSettlementVariables) => {
      const resp = await api.post<SettlementAllocationResponse>(
        "/settlements/allocate/loan",
        variables.data,
        {
          headers: { "Idempotency-Key": variables.idempotencyKey },
        }
      );
      return resp.data;
    },
  });
}

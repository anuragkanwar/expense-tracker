import type { LoanResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { groupsKeys } from "./queryKeys";

type GroupLoanListResponse = {
  loans: LoanResponse[];
  total: number;
  page: number;
  limit: number;
};

export function useGroupLoans(
  groupId: number,
  page?: number,
  limit?: number,
  type?: "given" | "taken" | "all"
) {
  return useSuspenseQuery({
    queryKey: groupsKeys.loansByGroup(groupId),
    queryFn: async () => {
      const resp = await api.get<GroupLoanListResponse>(
        `/groups/${groupId}/loans`,
        {
          params: { page, limit, type },
        }
      );
      return resp.data;
    },
  });
}

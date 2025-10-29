import type { SpendingByCategoryResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { dashboardKeys } from "./queryKeys";

export function useSpendingByCategory() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.spendingByCategory(),
    queryFn: async () => {
      const resp = await api.get<SpendingByCategoryResponse>(
        "/dashboard/spending-by-category"
      );
      return resp.data;
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import {
  PassbookResponseSchema,
  buildQueryString,
} from "@pocket-pixie/contracts";

import { z } from "@hono/zod-openapi";

export type PassbookResponse = z.infer<typeof PassbookResponseSchema>;

const BASE = "/api/v1/passbook";

// Define specific filter type for passbook
export interface PassbookFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  accountId?: number;
  entryType?: "transaction" | "expense" | "loan" | "all";
  status?: "unpaid" | "partially_paid" | "paid" | "all";
  [key: string]: string | number | boolean | undefined | null;
}

export function usePassbook(filters?: PassbookFilters) {
  return useQuery({
    queryKey: queryKeys.passbook.list(filters),
    queryFn: () =>
      getValidated(
        BASE + buildQueryString(filters ?? {}),
        PassbookResponseSchema
      ),
  });
}

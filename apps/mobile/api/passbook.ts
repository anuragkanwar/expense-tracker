import { useQuery } from "@tanstack/react-query";
import { getValidated } from "@/lib/api-utils";
import { queryKeys } from "@/lib/query-keys";
import { PassbookResponseSchema } from "@pocket-pixie/contracts";

import { z } from "@hono/zod-openapi";

export type PassbookResponse = z.infer<typeof PassbookResponseSchema>;

const BASE = "/api/v1/passbook";

function buildQuery(params: { [k: string]: any }) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return query ? `?${query}` : "";
}

export function usePassbook(filters?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  accountId?: number;
}) {
  return useQuery({
    queryKey: queryKeys.passbook.list(filters),
    queryFn: () =>
      getValidated(BASE + buildQuery(filters ?? {}), PassbookResponseSchema),
  });
}

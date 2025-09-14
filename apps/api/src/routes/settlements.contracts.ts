import { createRoute, z } from "@hono/zod-openapi";
import {
  ExpenseShareSettlementAllocateRequestSchema,
  ExpenseShareSettlementAllocateResponseSchema,
} from "@pocket-pixie/contracts";

export const allocateExpenseShareSettlementRoute = createRoute({
  method: "post",
  path: "/allocate",
  summary: "Allocate settlement across expense shares (FIFO)",
  description:
    "Allocates a settlement amount paid by the authenticated user (participant) to the original payer across outstanding expense shares using FIFO ordering.",
  tags: ["Settlements"],
  request: {
    headers: z
      .object({
        "Idempotency-Key": z.string().min(1).openapi({
          description:
            "Idempotency key to safely retry allocation requests without creating duplicates",
          example: "allocate-123e4567-e89b-12d3-a456-426614174000",
        }),
      })
      .openapi({ description: "Required idempotency header" }),
    body: {
      content: {
        "application/json": {
          schema: ExpenseShareSettlementAllocateRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      // 200 returned for both first successful allocation and idempotent replay

      content: {
        "application/json": {
          schema: ExpenseShareSettlementAllocateResponseSchema,
        },
      },
      description: "Settlement allocated successfully",
    },
    400: { description: "Validation Error or allocation failure" },
    409: {
      description: "Idempotency-Key conflict (payload mismatch on reuse)",
    },
    401: { description: "Unauthorized" },
  },
});

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
      content: {
        "application/json": {
          schema: ExpenseShareSettlementAllocateResponseSchema,
        },
      },
      description: "Settlement allocated successfully",
    },
    400: { description: "Validation Error or allocation failure" },
    401: { description: "Unauthorized" },
  },
});

import { createRoute, z } from "@hono/zod-openapi";
import {
  ExpenseShareSettlementAllocateRequestSchema,
  ExpenseShareSettlementAllocateResponseSchema,
} from "@pocket-pixie/contracts";
import {
  StandardErrorSchema,
  IdempotencyConflictErrorSchema,
} from "./shared-schemas";

export const allocateExpenseShareSettlementRoute = createRoute({
  method: "post",
  path: "/allocate",
  summary: "Allocate settlement across expense shares (FIFO)",
  description:
    "Allocates a settlement amount paid by the authenticated user (participant/debtor) to the original payer (creditor) " +
    "across outstanding expense shares using FIFO ordering by realizedAt timestamp and ID. " +
    "Updates expense_share records (paidAmount and status), creates settlement and settlement_application records, " +
    "and updates bilateral user_balance. " +
    "Allocation follows LOAN_TAKEN (-) → LOAN_GIVEN (+) accounting pattern to reduce outstanding obligations.",
  tags: ["Settlements"],
  operationId: "allocateExpenseShareSettlement", // Added operationId for unique identification
  request: {
    headers: z
      .object({
        "Idempotency-Key": z
          .string()
          .min(1)
          .openapi({
            description:
              "REQUIRED: Idempotency key to safely retry allocation requests without duplicates. " +
              "First use returns 200 OK, identical replay returns 200 OK with same results, " +
              "mismatched payload reuse returns 409 Conflict.",
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
      content: {
        "application/json": {
          schema: ExpenseShareSettlementAllocateResponseSchema,
        },
      },
      description:
        "Settlement allocated successfully (both new allocation and idempotent replay return 200)",
    },
    400: {
      description: "Validation Error or allocation failure",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "self-settlement": {
              value: {
                success: false,
                error: {
                  code: "INVALID_INPUT",
                  message: "Payer and payee cannot be the same user",
                },
              },
            },
            "non-positive": {
              value: {
                success: false,
                error: {
                  code: "INVALID_AMOUNT",
                  message: "Amount must be greater than zero",
                },
              },
            },
            "no-outstanding": {
              value: {
                success: false,
                error: {
                  code: "NO_OUTSTANDING_SHARES",
                  message: "No applicable outstanding expense shares found",
                },
              },
            },
            "over-allocation": {
              value: {
                success: false,
                error: {
                  code: "OVER_ALLOCATION",
                  message: "Allocation amount exceeds total outstanding",
                },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Idempotency-Key conflict (payload mismatch on reuse)",
      content: {
        "application/json": { schema: IdempotencyConflictErrorSchema },
      },
    },
    401: { description: "Unauthorized" },
  },
});

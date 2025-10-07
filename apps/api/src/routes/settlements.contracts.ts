import { createRoute, z } from "@hono/zod-openapi";
import { EXPENSE_SHARE_TYPE } from "@/db";
import {
  MonetaryAmountSchema,
  StandardErrorSchema,
  IdempotencyConflictErrorSchema,
} from "./shared-schemas";

// Unified settlement allocation request schema
export const unifiedSettlementAllocateRequestSchema = z.object({
  payeeId: z.number().int().positive(),
  amount: MonetaryAmountSchema,
  currency: z.string().length(3),
  groupId: z.number().int().positive().optional(),
  type: z
    .enum([EXPENSE_SHARE_TYPE.EXPENSE, EXPENSE_SHARE_TYPE.LOAN])
    .optional(),
});

// Expense share allocation request schema (same as unified but without type)
export const expenseShareOnlyAllocationRequestSchema =
  unifiedSettlementAllocateRequestSchema.omit({
    type: true,
  });

// Loan allocation request schema (same as unified but without type)
export const loanOnlyAllocationRequestSchema =
  unifiedSettlementAllocateRequestSchema.omit({
    type: true,
  });

// Settlement result schema
const settlementSchema = z.object({
  id: z.number().int(),
  payerId: z.number().int(),
  payeeId: z.number().int(),
  amount: z.number(),
  currency: z.string(),
  groupId: z.number().int().nullable().optional(),
  transactionId: z.number().int().nullable().optional(),
  settledAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Settlement application schema
const settlementApplicationSchema = z.object({
  id: z.number().int(),
  settlementId: z.number().int(),
  expenseShareId: z.number().int(),
  appliedAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Settlement allocation result including applications
export const unifiedSettlementAllocateResultSchema = z.object({
  settlement: settlementSchema,
  applications: z.array(settlementApplicationSchema),
  totalApplied: z.number(),
  outstandingBefore: z.number(),
  outstandingAfter: z.number(),
});

// Idempotency header schema (required for settlement operations)
const idempotencyHeaderSchema = z
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
  .openapi({ description: "Required idempotency header" });

// Common response definitions for allocation routes
const allocationSuccessResponse = {
  200: {
    content: {
      "application/json": {
        schema: unifiedSettlementAllocateResultSchema,
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
                message: "No applicable outstanding obligations found",
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
};

// Define all routes
export const allocateUnifiedSettlementRoute = createRoute({
  method: "post",
  path: "/allocate",
  summary: "Allocate settlement across all types of obligations",
  description:
    "Allocates a settlement amount paid by the authenticated user (participant/debtor) to the original payer (creditor) " +
    "across outstanding obligations using FIFO ordering. Can optionally filter by type (EXPENSE or LOAN). " +
    "Updates expense_share records (paidAmount and status), creates settlement and settlement_application records, " +
    "and updates bilateral user_balance.",
  tags: ["Settlements"],
  request: {
    headers: idempotencyHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: unifiedSettlementAllocateRequestSchema,
        },
      },
    },
  },
  responses: allocationSuccessResponse,
});

export const allocateExpenseSettlementRoute = createRoute({
  method: "post",
  path: "/allocate/expense",
  summary: "Allocate settlement across expense shares only",
  description:
    "Allocates a settlement amount paid by the authenticated user (participant/debtor) to the original payer (creditor) " +
    "across outstanding expense shares only using FIFO ordering. " +
    "Updates expense_share records (paidAmount and status), creates settlement and settlement_application records, " +
    "and updates bilateral user_balance.",
  tags: ["Settlements"],
  request: {
    headers: idempotencyHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: expenseShareOnlyAllocationRequestSchema,
        },
      },
    },
  },
  responses: allocationSuccessResponse,
});

export const allocateLoanSettlementRoute = createRoute({
  method: "post",
  path: "/allocate/loan",
  summary: "Allocate settlement across loans only",
  description:
    "Allocates a settlement amount paid by the authenticated user (participant/debtor) to the original payer (creditor) " +
    "across outstanding loans only using FIFO ordering. " +
    "Updates expense_share records (paidAmount and status), creates settlement and settlement_application records, " +
    "and updates bilateral user_balance.",
  tags: ["Settlements"],
  request: {
    headers: idempotencyHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: loanOnlyAllocationRequestSchema,
        },
      },
    },
  },
  responses: allocationSuccessResponse,
});

export const getSettlementByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get settlement details by ID",
  description: "Retrieves full details of a specific settlement by its ID",
  tags: ["Settlements"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        type: "string",
        description: "Settlement ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: settlementSchema,
        },
      },
      description: "Settlement found",
    },
    404: {
      description: "Settlement not found",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "not-found": {
              value: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Settlement not found",
                },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

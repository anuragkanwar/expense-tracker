import { createRoute, z } from "@hono/zod-openapi";
import {
  IdParamSchema,
  MessageResponseSchema,
  StandardErrorSchema,
} from "./shared-schemas";
import {
  LoanResponseSchema,
  LoanCreateSchema,
  LoanUpdateSchema,
} from "@pocket-pixie/contracts";

// NOTE: Loan creation today reuses transaction semantics (single split) enforced in LoanService.
// Future: introduce explicit participantUserId field instead of splits array in request contract.

export const createLoanRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create direct loan (canonical)",
  description:
    "Creates a bilateral loan between the authenticated user (lender/payer) and exactly one other user via single split semantics. Only LOAN_GIVEN direction is accepted; LOAN_TAKEN requests are rejected (Flag F5 Stage 3 interim). TransactionService loan path is blocked.",
  tags: ["Loans"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoanCreateSchema.pick({
            description: true,
            amount: true,
            currency: true,
            groupId: true,
            loanDate: true,
          })
            .extend({
              sourceTransactionAccountID: z.number().openapi({
                example: 101,
                description: "Payer's LOAN_GIVEN account id",
              }),
              targetTransactionAccountID: z.number().openapi({
                example: 202,
                description: "Borrower's LOAN_TAKEN account id",
              }),
              sharedWith: z
                .enum(["FRIENDS", "GROUP"] as const)
                .openapi({ description: "Context of the loan" }),
              splitType: z.string().openapi({
                example: "EQUAL",
                description: "Split type (only EQUAL currently meaningful)",
              }),
              splits: z
                .array(
                  z.object({
                    userId: z.number().openapi({
                      example: 456,
                      description: "Borrower user id",
                    }),
                    amountOwed: z.number().openapi({
                      example: 200,
                      description: "Must equal total amount",
                    }),
                  })
                )
                .length(1)
                .openapi({
                  description: "Single split representing the borrower",
                }),
              type: z.literal("LOAN_GIVEN").openapi({
                description:
                  "Canonical loan direction. LOAN_TAKEN creation is disabled and will return 400 if attempted.",
              }),
            })
            .openapi("LoanCreateRequest"),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: LoanResponseSchema,
        },
      },
      description: "Loan created successfully",
    },
    400: {
      description: "Validation Error",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    401: { description: "Unauthorized" },
    404: {
      description: "Related resource not found (e.g., accounts or group)",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

export const getLoansRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user's loans",
  description:
    "Lists loans the authenticated user created (future: include participation).",
  tags: ["Loans"],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .openapi({ example: 1 }),
      limit: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .openapi({ example: 20 }),
      type: z.string().optional().openapi({
        example: "LOAN_GIVEN",
        description: "Filter placeholder",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              loans: z.array(LoanResponseSchema),
              total: z.number(),
              page: z.number(),
              limit: z.number(),
            })
            .openapi("LoanListResponse"),
        },
      },
      description: "Loans retrieved successfully",
    },
    400: {
      description: "Validation Error",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    401: { description: "Unauthorized" },
  },
});

export const getLoanRoute = createRoute({
  method: "get",
  path: "/{loanId}",
  summary: "Get loan details",
  description: "Retrieves a single loan (creator only for now).",
  tags: ["Loans"],
  request: {
    params: z.object({
      loanId: IdParamSchema.openapi({ description: "Loan ID" }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: LoanResponseSchema } },
      description: "Loan details retrieved successfully",
    },
    400: {
      description: "Validation Error",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    401: { description: "Unauthorized" },
    404: {
      description: "Loan not found",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

export const updateLoanRoute = createRoute({
  method: "put",
  path: "/{loanId}",
  summary: "Update loan",
  description: "Updates loan fields (description, loanDate).",
  tags: ["Loans"],
  request: {
    params: z.object({
      loanId: IdParamSchema.openapi({ description: "Loan ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: LoanUpdateSchema.partial().openapi("LoanUpdateRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: LoanResponseSchema } },
      description: "Loan updated successfully",
    },
    400: {
      description: "Validation Error",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    401: { description: "Unauthorized" },
    404: {
      description: "Loan not found",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

export const deleteLoanRoute = createRoute({
  method: "delete",
  path: "/{loanId}",
  summary: "Delete loan",
  description: "Deletes a loan (creator only).",
  tags: ["Loans"],
  request: {
    params: z.object({
      loanId: IdParamSchema.openapi({ description: "Loan ID" }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: MessageResponseSchema } },
      description: "Loan deleted successfully",
    },
    400: {
      description: "Validation Error",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    401: { description: "Unauthorized" },
    404: {
      description: "Loan not found",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

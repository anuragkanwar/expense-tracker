import { createRoute, z } from "@hono/zod-openapi";
import {
  IdParamSchema,
  MessageResponseSchema,
  StandardErrorSchema,
} from "./shared-schemas";
import {
  LoanResponseSchema,
  LoanCreateSymmetricSchema,
  LoanUpdateSchema,
} from "@pocket-pixie/contracts";

// Canonical Symmetric Direct Loan Route
// Legacy directional create route has been removed. Clients must use the
// symmetric POST /api/v1/loans/symmetric endpoint.
export const createLoanSymmetricRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create direct loan (symmetric – canonical)",
  description:
    "Creates a bilateral loan between a creditor and debtor where either can be the authenticated user. " +
    "Both creditorId and debtorId must be explicitly provided, and one of them must match the authenticated user. " +
    "Follows LOAN_GIVEN (-) → LOAN_TAKEN (+) accounting pattern. " +
    "Requires either an existing friendship between creditor and debtor or both must be members of the specified group. " +
    "Creates a transaction record, two transaction_entry ledger rows, a loan record, one loan_split record, and updates bilateral balances.",
  tags: ["Loans"],
  operationId: "createLoanSymmetric", // Added operationId for unique identification
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoanCreateSymmetricSchema.openapi(
            "LoanCreateSymmetricRequestBody"
          ),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: LoanResponseSchema } },
      description: "Loan created successfully (symmetric canonical)",
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "self-loan": {
              value: {
                success: false,
                error: {
                  code: "INVALID_INPUT",
                  message: "Cannot create loan to yourself",
                },
              },
            },
            "invalid-context": {
              value: {
                success: false,
                error: {
                  code: "INVALID_RELATIONSHIP",
                  message: "No friendship or group context for loan",
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
            "invalid-currency": {
              value: {
                success: false,
                error: {
                  code: "INVALID_CURRENCY",
                  message: "Currency must be a valid 3-letter ISO code",
                },
              },
            },
            "invalid-user-role": {
              value: {
                success: false,
                error: {
                  code: "INVALID_USER_ROLE",
                  message:
                    "Authenticated user must be either creditor or debtor",
                },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
    404: {
      description:
        "Related resource not found (e.g., group membership, accounts)",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

export const LoanListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().optional().openapi({ example: 20 }),
  type: z.enum(["given", "taken", "all"]).optional().openapi({
    example: "given",
    description:
      "Filter loans by user's role: 'given' (as creditor), 'taken' (as debtor), or 'all' (both)",
  }),
});

export type LoanListQuery = z.infer<typeof LoanListQuerySchema>;

export const getLoansRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user's loans",
  description:
    "Lists loans the authenticated user created (future: include participation).",
  tags: ["Loans"],
  request: {
    query: LoanListQuerySchema,
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

// Friend and Group loan routes moved to their respective contract files

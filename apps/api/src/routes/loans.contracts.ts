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
  path: "/symmetric",
  summary: "Create direct loan (symmetric – canonical)",
  description:
    "Creates a bilateral loan where the authenticated user is implicitly the creditor. No account ids, splits, or direction field are required.",
  tags: ["Loans"],
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
      content: { "application/json": { schema: StandardErrorSchema } },
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
  type: z.string().optional().openapi({
    example: "LOAN_GIVEN",
    description: "Filter placeholder",
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

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
    "Creates a bilateral loan where the authenticated user is implicitly the creditor lending to the debtor. " +
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

export const GroupLoanListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().optional().openapi({ example: 20 }),
  type: z.enum(["given", "taken", "all"]).optional().openapi({
    example: "all",
    description:
      "Filter loans by user's role in the group: 'given' (as creditor), 'taken' (as debtor), or 'all' (both)",
  }),
});

export type LoanListQuery = z.infer<typeof LoanListQuerySchema>;
export type GroupLoanListQuery = z.infer<typeof GroupLoanListQuerySchema>;

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

// Add Friend Loan Query Schema
export const FriendLoanListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().optional().openapi({ example: 20 }),
});

export type FriendLoanListQuery = z.infer<typeof FriendLoanListQuerySchema>;

// Friend Loans API Contracts
export const getFriendLoansRoute = createRoute({
  method: "get",
  path: "/friends/{friendId}/loans",
  summary: "List loans between friends",
  description:
    "Lists loans between the authenticated user and a specific friend. Requires active friendship. " +
    "Returns loans where either the authenticated user is the creditor and the friend is the debtor, " +
    "or where the friend is the creditor and the authenticated user is the debtor. " +
    "This endpoint provides a consolidated view of the bilateral loan relationship between two friends, " +
    "showing both money lent and borrowed. Results are paginated and sorted by creation date (most recent first).",
  tags: ["Loans", "Friends"],
  request: {
    params: z.object({
      friendId: IdParamSchema.openapi({ description: "Friend ID" }),
    }),
    query: FriendLoanListQuerySchema,
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
            .openapi("FriendLoanListResponse"),
          examples: {
            "friend-loans": {
              value: {
                loans: [
                  {
                    id: 101,
                    amount: 50,
                    currency: "USD",
                    description: "Dinner",
                    creditorId: 100,
                    debtorId: 200,
                    transactionId: 401,
                    createdAt: "2025-09-16T12:00:00Z",
                  },
                  {
                    id: 102,
                    amount: 75.5,
                    currency: "USD",
                    description: "Movie tickets",
                    creditorId: 200,
                    debtorId: 100,
                    transactionId: 402,
                    createdAt: "2025-09-17T15:30:00Z",
                  },
                ],
                total: 2,
                page: 1,
                limit: 20,
              },
            },
          },
        },
      },
      description: "Friend loans retrieved successfully",
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "not-friends": {
              value: {
                success: false,
                error: {
                  code: "INVALID_RELATIONSHIP",
                  message: "You can only view expenses with friends",
                },
              },
            },
            "invalid-params": {
              value: {
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Invalid pagination parameters",
                },
              },
            },
            "self-reference": {
              value: {
                success: false,
                error: {
                  code: "INVALID_INPUT",
                  message: "Cannot view loans with yourself",
                },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
    403: {
      description: "Not friends with user",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
  },
});

// Group Loans API Contracts
export const getGroupLoansRoute = createRoute({
  method: "get",
  path: "/groups/{groupId}/loans",
  summary: "List group loans",
  description:
    "Lists loans within a specific group context. Requires group membership. " +
    "Returns all loans associated with the specified group where the authenticated user " +
    "is involved either as a creditor or debtor. Supports pagination and optional filtering " +
    "by the user's role (given, taken, or all loans).",
  tags: ["Loans", "Groups"],
  request: {
    params: z.object({
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
    }),
    query: GroupLoanListQuerySchema,
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
            .openapi("GroupLoanListResponse"),
          examples: {
            "group-loans": {
              value: {
                loans: [
                  {
                    id: 101,
                    amount: 50,
                    currency: "USD",
                    description: "Group dinner expense",
                    creditorId: 100,
                    debtorId: 200,
                    groupId: 300,
                    transactionId: 401,
                    createdAt: "2025-09-16T12:00:00Z",
                    loanDate: "2025-09-16T12:00:00Z",
                  },
                  {
                    id: 102,
                    amount: 75.5,
                    currency: "USD",
                    description: "Concert tickets",
                    creditorId: 200,
                    debtorId: 100,
                    groupId: 300,
                    transactionId: 402,
                    createdAt: "2025-09-17T15:30:00Z",
                    loanDate: "2025-09-17T15:30:00Z",
                  },
                ],
                total: 2,
                page: 1,
                limit: 20,
              },
            },
          },
        },
      },
      description: "Group loans retrieved successfully",
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "not-member": {
              value: {
                success: false,
                error: {
                  code: "INVALID_RELATIONSHIP",
                  message: "You don't have access to this group",
                },
              },
            },
            "invalid-params": {
              value: {
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Invalid pagination parameters",
                },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
    403: {
      description: "Not a group member",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    404: {
      description: "Group not found",
      content: {
        "application/json": {
          schema: StandardErrorSchema,
          examples: {
            "group-not-found": {
              value: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Group not found",
                },
              },
            },
          },
        },
      },
    },
  },
});

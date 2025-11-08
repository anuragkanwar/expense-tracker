// Transaction contracts
import {
  LoanResponseSchema,
  TransactionCreateWithDetailsSchema,
  TransactionCreateWithAIPromptSchema,
  TransactionUpdateWithDetailsSchema,
  TransactionWithDetailsResponseSchema,
  TransactionListResponseSchema,
  TransactionResponseSchema,
} from "@pocket-pixie/contracts";
import { createRoute, z } from "@hono/zod-openapi";
import { StandardErrorSchema } from "./shared-schemas";

// New Transaction List Response using updated TransactionResponseSchema
export const NewTransactionListResponseSchema = z
  .object({
    transactions: z.array(TransactionResponseSchema),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
  })
  .openapi("NewTransactionListResponse");

export const createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new transaction",
  description:
    "Creates a new transaction with payers and split details. For shared expenses, " +
    "creates a primary transaction for the payer's share, then creates loan relationships " +
    "for each participant (LOAN_GIVEN → LOAN_TAKEN), generates expense_share records to track " +
    "obligations, and updates bilateral user_balance records. Follows the accounting patterns " +
    "described in LLD section 5.5 (Shared Expense flow).",
  tags: ["Transactions"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TransactionCreateWithDetailsSchema.omit({ groupId: true }), // groupId optional or from context
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TransactionWithDetailsResponseSchema,
        },
      },
      description: "Transaction created successfully",
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: StandardErrorSchema, // Added the required schema reference
          examples: {
            "invalid-amount": {
              value: {
                success: false,
                error: {
                  code: "INVALID_AMOUNT",
                  message: "Transaction amount must be positive",
                },
              },
            },
            "invalid-relationships": {
              value: {
                success: false,
                error: {
                  code: "INVALID_RELATIONSHIP",
                  message: "All participants must be friends or group members",
                },
              },
            },
            "invalid-split": {
              value: {
                success: false,
                error: {
                  code: "INVALID_SPLIT",
                  message: "Sum of splits must equal transaction amount",
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

export const getTransactionRoute = createRoute({
  method: "get",
  path: "/{transactionId}",
  summary: "Get transaction details",
  description:
    "Retrieves the details of a single transaction, including how it was split.",
  tags: ["Transactions"],
  request: {
    params: z.object({
      transactionId: z.coerce.number().int().positive().openapi({
        example: 123,
        description: "Transaction ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema,
        },
      },
      description: "Transaction details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Transaction not found" },
  },
});

export const getGroupTransactionsRoute = createRoute({
  method: "get",
  path: "/groups/{groupId}",
  summary: "List group transactions",
  description:
    "Lists all transactions associated with a specific group, with support for pagination.",
  tags: ["Transactions"],
  request: {
    params: z.object({
      groupId: z.coerce.number().int().positive().openapi({
        example: 123,
        description: "Group ID",
      }),
    }),
    query: z.object({
      page: z.coerce.number().int().positive().optional().openapi({
        example: 1,
        description: "Page number",
      }),
      limit: z.coerce.number().int().positive().optional().openapi({
        example: 10,
        description: "Items per page",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NewTransactionListResponseSchema,
        },
      },
      description: "Group transactions retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const updateTransactionRoute = createRoute({
  method: "put",
  path: "/{transactionId}",
  summary: "Update transaction",
  description:
    "Updates an existing transaction. This action will trigger recalculation of balances.",
  tags: ["Transactions"],
  request: {
    params: z.object({
      transactionId: z.coerce.number().int().positive().openapi({
        example: 123,
        description: "Transaction ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: TransactionUpdateWithDetailsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema,
        },
      },
      description: "Transaction updated successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Transaction not found" },
  },
});

export const getTransactionsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user transactions",
  description:
    "Lists all transactions the current user is involved in (paginated).",
  tags: ["Transactions"],
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().optional().openapi({
        example: 1,
        description: "Page number",
      }),
      limit: z.coerce.number().int().positive().optional().openapi({
        example: 20,
        description: "Items per page",
      }),
      type: z.string().optional().openapi({
        example: "group",
        description: "Filter by transaction type (group, friend, personal)",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NewTransactionListResponseSchema,
        },
      },
      description: "Transactions retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getFriendTransactionsRoute = createRoute({
  method: "get",
  path: "/friends/{userId}",
  summary: "List friend transactions",
  description:
    "Lists all non-group transactions between the current user and a friend.",
  tags: ["Transactions"],
  request: {
    params: z.object({
      userId: z.coerce.number().int().positive().openapi({
        example: 456,
        description: "Friend's user ID",
      }),
    }),
    query: z.object({
      page: z.coerce.number().int().positive().optional().openapi({
        example: 1,
        description: "Page number",
      }),
      limit: z.coerce.number().int().positive().optional().openapi({
        example: 20,
        description: "Items per page",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NewTransactionListResponseSchema,
        },
      },
      description: "Friend transactions retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Friend not found" },
  },
});

export const deleteTransactionRoute = createRoute({
  method: "delete",
  path: "/{transactionId}",
  summary: "Delete transaction",
  description:
    "Deletes a transaction, which will also trigger a balance recalculation.",
  tags: ["Transactions"],
  request: {
    params: z.object({
      transactionId: z.coerce.number().int().positive().openapi({
        example: 123,
        description: "Transaction ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Transaction deleted successfully" }),
          }),
        },
      },
      description: "Transaction deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Transaction not found" },
  },
});

export const createTransactionWithAIRoute = createRoute({
  method: "post",
  path: "/ai",
  summary: "Create transaction with AI prompt",
  description:
    "Creates a new transaction using natural language input. The AI will parse the prompt to extract transaction details, payers, and splits.",
  tags: ["Transactions"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TransactionCreateWithAIPromptSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TransactionWithDetailsResponseSchema,
        },
      },
      description: "Transaction created successfully via AI",
    },
    400: { description: "Validation Error or AI parsing failed" },
    401: { description: "Unauthorized" },
  },
});

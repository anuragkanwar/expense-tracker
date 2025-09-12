// Transaction contracts
import { LoanResponseSchema } from "@/models/loan";
import { createRoute, z } from "@hono/zod-openapi";
import {
  TransactionCreateWithDetailsSchema,
  TransactionCreateWithAIPromptSchema,
  TransactionUpdateWithDetailsSchema,
  TransactionWithDetailsResponseSchema,
  TransactionListResponseSchema,
} from "@/dto/transactions.dto";

export const createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new transaction",
  description:
    "Creates a new transaction with payers and split details. The request includes total amount, payer(s), and split object specifying the type and data for each participant.",
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
    400: { description: "Validation Error" },
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
          schema: TransactionWithDetailsResponseSchema,
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
          schema: TransactionListResponseSchema,
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
          schema: TransactionWithDetailsResponseSchema,
        },
      },
      description: "Transaction updated successfully",
    },
    400: { description: "Validation Error" },
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
          schema: z
            .object({
              transactions: z.array(LoanResponseSchema),
              total: z.number().openapi({ example: 100 }),
              page: z.number().openapi({ example: 1 }),
              limit: z.number().openapi({ example: 20 }),
            })
            .openapi("TransactionListResponse"),
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
          schema: z
            .object({
              transactions: z.array(LoanResponseSchema),
              total: z.number().openapi({ example: 25 }),
              page: z.number().openapi({ example: 1 }),
              limit: z.number().openapi({ example: 20 }),
            })
            .openapi("FriendTransactionListResponse"),
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

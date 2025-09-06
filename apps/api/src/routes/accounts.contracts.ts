import { createRoute, z } from "@hono/zod-openapi";
import {
  TransactionAccountResponseSchema,
  TransactionAccountCreateSchema,
} from "@/models/transaction-account";

export const getAccountsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user accounts",
  description:
    "Lists all of the user's financial accounts (e.g., bank accounts, cash).",
  tags: ["Accounts"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .array(TransactionAccountResponseSchema)
            .openapi("AccountsListResponse"),
        },
      },
      description: "Accounts retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createAccountRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create account",
  description:
    "Creates a new financial account (e.g., adding a new credit card).",
  tags: ["Accounts"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TransactionAccountCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getAccountRoute = createRoute({
  method: "get",
  path: "/{accountId}",
  summary: "Get account details",
  description: "Retrieves details for a single financial account.",
  tags: ["Accounts"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

export const updateAccountRoute = createRoute({
  method: "put",
  path: "/{accountId}",
  summary: "Update account",
  description: "Updates a financial account.",
  tags: ["Accounts"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: TransactionAccountCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

export const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/{accountId}",
  summary: "Delete account",
  description: "Deletes a financial account.",
  tags: ["Accounts"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
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
              .openapi({ example: "Account deleted successfully" }),
          }),
        },
      },
      description: "Account deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

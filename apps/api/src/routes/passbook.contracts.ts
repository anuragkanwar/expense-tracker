import { TransactionAccountResponseSchema } from "@/models/transaction-account";
import { TransactionCreateSchema } from "@/models/transaction";
import { TransactionEntryResponseSchema } from "@/models/transaction-entry";
import { createRoute, z } from "@hono/zod-openapi";

// Balance response schema
export const AccountBalanceResponseSchema = z
  .object({
    accountId: z.string().openapi({
      example: "acc_123",
      description: "Account ID",
    }),
    balance: z.number().openapi({
      example: 1250.5,
      description: "Current account balance",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Account currency",
    }),
  })
  .openapi("AccountBalanceResponse");

// Passbook list response with pagination
export const PassbookResponseSchema = z
  .object({
    entries: z.array(TransactionEntryResponseSchema).openapi({
      description: "List of transaction entries",
    }),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
  })
  .openapi("PassbookResponse");

// Accounts list response
export const AccountsListResponseSchema = z
  .array(TransactionAccountResponseSchema)
  .openapi("AccountsListResponse");

export const createTransactionRoute = createRoute({
  method: "post",
  path: "/transactions",
  summary: "Create transaction (Internal)",
  description:
    "Internal endpoint used by other services to create new financial transactions. Not exposed to clients.",
  tags: ["Passbook"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TransactionCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().openapi({ example: "txn_123" }),
            message: z
              .string()
              .openapi({ example: "Transaction created successfully" }),
          }),
        },
      },
      description: "Transaction created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getPassbookRoute = createRoute({
  method: "get",
  path: "/passbook",
  summary: "Get passbook entries",
  description:
    "Retrieves a paginated, chronological list of all transaction entries for the current user's accounts. Supports filtering by date range, category, and account.",
  tags: ["Passbook"],
  request: {
    query: z.object({
      page: z.string().optional().openapi({
        example: "1",
        description: "Page number",
      }),
      limit: z.string().optional().openapi({
        example: "20",
        description: "Items per page",
      }),
      startDate: z.string().optional().openapi({
        example: "2025-01-01T00:00:00.000Z",
        description: "Filter by start date",
      }),
      endDate: z.string().optional().openapi({
        example: "2025-12-31T23:59:59.999Z",
        description: "Filter by end date",
      }),
      categoryId: z.string().optional().openapi({
        example: "cat_123",
        description: "Filter by category",
      }),
      accountId: z.string().optional().openapi({
        example: "acc_123",
        description: "Filter by account",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PassbookResponseSchema,
        },
      },
      description: "Passbook entries retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getAccountsRoute = createRoute({
  method: "get",
  path: "/accounts",
  summary: "List user accounts",
  description:
    "Lists all of the user's internal financial accounts (e.g., 'Main Wallet', 'External Bank Account').",
  tags: ["Passbook"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AccountsListResponseSchema,
        },
      },
      description: "Accounts retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getAccountBalanceRoute = createRoute({
  method: "get",
  path: "/accounts/{accountId}/balance",
  summary: "Get account balance",
  description:
    "Calculates and returns the current balance of a specific account by summing all its transaction entries.",
  tags: ["Passbook"],
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
          schema: AccountBalanceResponseSchema,
        },
      },
      description: "Account balance calculated successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

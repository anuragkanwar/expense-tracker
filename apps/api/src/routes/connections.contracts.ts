import { createRoute, z } from "@hono/zod-openapi";

// Link token request schema
export const LinkTokenRequestSchema = z
  .object({
    provider: z.string().openapi({
      example: "plaid",
      description: "Third-party provider name (e.g., plaid, stripe)",
    }),
    products: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["transactions", "accounts"],
        description: "Products to link (optional)",
      }),
    countryCodes: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["US"],
        description: "Country codes for the connection",
      }),
    language: z.string().optional().openapi({
      example: "en",
      description: "Language for the linking flow",
    }),
  })
  .openapi("LinkTokenRequest");

// Link token response schema
export const LinkTokenResponseSchema = z
  .object({
    linkToken: z.string().openapi({
      example: "link-sandbox-12345678-1234-1234-1234-123456789012",
      description: "Short-lived link token for client-side linking",
    }),
    expiration: z.string().openapi({
      example: "2025-09-01T13:00:00.000Z",
      description: "Token expiration time",
    }),
    requestId: z.string().openapi({
      example: "req_123456",
      description: "Request identifier for tracking",
    }),
  })
  .openapi("LinkTokenResponse");

// Sync request schema
export const SyncRequestSchema = z
  .object({
    accountIds: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["acc_123", "acc_456"],
        description:
          "Specific account IDs to sync (optional - syncs all if not provided)",
      }),
    fullSync: z.boolean().optional().openapi({
      example: false,
      description: "Whether to perform full sync or incremental",
    }),
  })
  .openapi("SyncRequest");

// Sync response schema
export const SyncResponseSchema = z
  .object({
    syncId: z.string().openapi({
      example: "sync_123456",
      description: "Unique sync operation identifier",
    }),
    status: z.enum(["pending", "processing", "completed", "failed"]).openapi({
      example: "pending",
      description: "Current sync status",
    }),
    accountsSynced: z.number().openapi({
      example: 3,
      description: "Number of accounts processed",
    }),
    transactionsAdded: z.number().openapi({
      example: 25,
      description: "Number of new transactions added",
    }),
    message: z.string().openapi({
      example: "Sync initiated successfully",
      description: "Status message",
    }),
  })
  .openapi("SyncResponse");

export const createLinkTokenRoute = createRoute({
  method: "post",
  path: "/link-token",
  summary: "Generate link token",
  description:
    "Generates a short-lived link token from the third-party provider, which the client application uses to initiate the secure account linking flow.",
  tags: ["Connections"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LinkTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LinkTokenResponseSchema,
        },
      },
      description: "Link token generated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    500: { description: "Provider Error" },
  },
});

export const syncConnectionsRoute = createRoute({
  method: "post",
  path: "/sync",
  summary: "Sync connected accounts",
  description:
    "Allows the user to manually trigger a data synchronization process for their connected accounts.",
  tags: ["Connections"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SyncRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SyncResponseSchema,
        },
      },
      description: "Sync initiated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    429: { description: "Too Many Requests" },
  },
});

// Monthly data aggregation request schema
export const MonthlyDataRequestSchema = z
  .object({
    year: z.number().optional().openapi({
      example: 2025,
      description: "Year for data aggregation (defaults to current year)",
    }),
    month: z.number().min(1).max(12).optional().openapi({
      example: 9,
      description:
        "Month for data aggregation (1-12, defaults to current month)",
    }),
  })
  .openapi("MonthlyDataRequest");

// Monthly data aggregation response schema
export const MonthlyDataResponseSchema = z
  .object({
    period: z
      .object({
        year: z.number().openapi({ example: 2025 }),
        month: z.number().openapi({ example: 9 }),
        monthName: z.string().openapi({ example: "September" }),
      })
      .openapi("Period"),
    summary: z
      .object({
        totalIncome: z.number().openapi({ example: 5000.0 }),
        totalExpenses: z.number().openapi({ example: 3200.0 }),
        netIncome: z.number().openapi({ example: 1800.0 }),
        transactionCount: z.number().openapi({ example: 45 }),
      })
      .openapi("Summary"),
    categories: z
      .array(
        z.object({
          categoryId: z.string().openapi({ example: "cat_123" }),
          categoryName: z.string().openapi({ example: "Food & Dining" }),
          amount: z.number().openapi({ example: 450.0 }),
          percentage: z.number().openapi({ example: 14.1 }),
          transactionCount: z.number().openapi({ example: 12 }),
        })
      )
      .openapi("Categories"),
    accounts: z
      .array(
        z.object({
          accountId: z.string().openapi({ example: "acc_123" }),
          accountName: z.string().openapi({ example: "Chase Checking" }),
          balance: z.number().openapi({ example: 2500.0 }),
          transactions: z.number().openapi({ example: 15 }),
        })
      )
      .openapi("Accounts"),
    trends: z
      .object({
        incomeChange: z
          .number()
          .openapi({
            example: 8.5,
            description: "Percentage change from previous month",
          }),
        expenseChange: z
          .number()
          .openapi({
            example: -2.3,
            description: "Percentage change from previous month",
          }),
        topSpendingCategory: z.string().openapi({ example: "Food & Dining" }),
      })
      .openapi("Trends"),
  })
  .openapi("MonthlyDataResponse");

export const getMonthlyDataRoute = createRoute({
  method: "get",
  path: "/monthly-data",
  summary: "Get monthly financial data",
  description:
    "Retrieves aggregated financial data for a specific month and year. Used for homepage dashboard and historical analysis.",
  tags: ["Connections"],
  request: {
    query: MonthlyDataRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MonthlyDataResponseSchema,
        },
      },
      description: "Monthly data retrieved successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "No data found for period" },
  },
});

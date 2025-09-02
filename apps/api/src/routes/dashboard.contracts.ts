import { createRoute, z } from "@hono/zod-openapi";

// Monthly summary response schema
export const MonthlySummaryResponseSchema = z
  .object({
    month: z.string().openapi({
      example: "September 2025",
      description: "Current month name and year",
    }),
    totalIncome: z.number().openapi({
      example: 5000.0,
      description: "Total income for the month",
    }),
    totalExpenses: z.number().openapi({
      example: 3200.0,
      description: "Total expenses for the month",
    }),
    netIncome: z.number().openapi({
      example: 1800.0,
      description: "Net income (income - expenses)",
    }),
    budgetUtilization: z.number().openapi({
      example: 85.5,
      description: "Percentage of budget used",
    }),
    savingsRate: z.number().openapi({
      example: 36.0,
      description: "Savings rate percentage",
    }),
    topExpenseCategory: z
      .object({
        name: z.string().openapi({ example: "Food & Dining" }),
        amount: z.number().openapi({ example: 450.0 }),
        percentage: z.number().openapi({ example: 14.1 }),
      })
      .openapi("TopExpenseCategory"),
  })
  .openapi("MonthlySummaryResponse");

// Spending by category response schema
export const SpendingByCategoryResponseSchema = z
  .array(
    z.object({
      categoryId: z.string().openapi({
        example: "cat_123",
        description: "Category ID",
      }),
      categoryName: z.string().openapi({
        example: "Food & Dining",
        description: "Category name",
      }),
      amount: z.number().openapi({
        example: 450.0,
        description: "Total spent in this category",
      }),
      percentage: z.number().openapi({
        example: 14.1,
        description: "Percentage of total expenses",
      }),
      transactionCount: z.number().openapi({
        example: 12,
        description: "Number of transactions in this category",
      }),
      trend: z.enum(["up", "down", "stable"]).openapi({
        example: "up",
        description: "Spending trend compared to last month",
      }),
    })
  )
  .openapi("SpendingByCategoryResponse");

// Upcoming bills response schema
export const UpcomingBillsResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
      description: z.string().openapi({
        example: "Netflix Subscription",
        description: "Bill description",
      }),
      amount: z.number().openapi({
        example: 15.99,
        description: "Bill amount",
      }),
      dueDate: z.string().openapi({
        example: "2025-09-15T00:00:00.000Z",
        description: "Due date",
      }),
      daysUntilDue: z.number().openapi({
        example: 7,
        description: "Days until due",
      }),
      category: z.string().openapi({
        example: "Entertainment",
        description: "Bill category",
      }),
      priority: z.enum(["high", "medium", "low"]).openapi({
        example: "medium",
        description: "Payment priority",
      }),
    })
  )
  .openapi("UpcomingBillsResponse");

// Net worth trend response schema
export const NetWorthTrendResponseSchema = z
  .array(
    z.object({
      date: z.string().openapi({
        example: "2025-09-01",
        description: "Date for the data point",
      }),
      netWorth: z.number().openapi({
        example: 25000.0,
        description: "Net worth on this date",
      }),
      assets: z.number().openapi({
        example: 30000.0,
        description: "Total assets",
      }),
      liabilities: z.number().openapi({
        example: 5000.0,
        description: "Total liabilities",
      }),
      change: z.number().openapi({
        example: 500.0,
        description: "Change from previous period",
      }),
      changePercentage: z.number().openapi({
        example: 2.0,
        description: "Percentage change from previous period",
      }),
    })
  )
  .openapi("NetWorthTrendResponse");

export const getMonthlySummaryRoute = createRoute({
  method: "get",
  path: "/monthly-summary",
  summary: "Get monthly summary",
  description:
    "Retrieves a consolidated summary for the current month's homepage.",
  tags: ["Dashboard"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MonthlySummaryResponseSchema,
        },
      },
      description: "Monthly summary retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getSpendingByCategoryRoute = createRoute({
  method: "get",
  path: "/spending-by-category",
  summary: "Get spending by category",
  description:
    "Gets a breakdown of spending by category for the current month.",
  tags: ["Dashboard"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SpendingByCategoryResponseSchema,
        },
      },
      description: "Spending by category retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getUpcomingBillsRoute = createRoute({
  method: "get",
  path: "/upcoming-bills",
  summary: "Get upcoming bills",
  description: "Lists upcoming recurring expenses for the next 30 days.",
  tags: ["Dashboard"],
  request: {
    query: z.object({
      days: z.string().optional().openapi({
        example: "30",
        description: "Number of days to look ahead (default: 30)",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UpcomingBillsResponseSchema,
        },
      },
      description: "Upcoming bills retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getNetWorthTrendRoute = createRoute({
  method: "get",
  path: "/net-worth-trend",
  summary: "Get net worth trend",
  description:
    "Gets data points for a net worth trend line over the last 6-12 months.",
  tags: ["Dashboard"],
  request: {
    query: z.object({
      months: z.string().optional().openapi({
        example: "12",
        description: "Number of months to include (default: 12)",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NetWorthTrendResponseSchema,
        },
      },
      description: "Net worth trend retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

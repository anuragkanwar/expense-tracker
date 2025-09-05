import { z } from "@hono/zod-openapi";

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

// Spending analytics response schema
export const SpendingAnalyticsResponseSchema = z
  .object({
    totalSpending: z.number().openapi({
      example: 3200.0,
      description: "Total spending for the month",
    }),
    categories: z
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
      .openapi("CategorySpending"),
    analytics: z
      .object({
        numberOfCategories: z.number().openapi({
          example: 8,
          description: "Number of categories with spending",
        }),
        averageSpendingPerCategory: z.number().openapi({
          example: 400.0,
          description: "Average spending per category",
        }),
        minSpending: z.number().openapi({
          example: 50.0,
          description: "Minimum spending in any category",
        }),
        maxSpending: z.number().openapi({
          example: 800.0,
          description: "Maximum spending in any category",
        }),
        totalTransactions: z.number().openapi({
          example: 120,
          description: "Total number of transactions across all categories",
        }),
        sumOfPercentages: z.number().openapi({
          example: 100.0,
          description: "Sum of all category percentages (should equal 100)",
        }),
        standardDeviation: z.number().openapi({
          example: 150.0,
          description: "Standard deviation of category spendings",
        }),
      })
      .openapi("SpendingAnalytics"),
  })
  .openapi("SpendingAnalyticsResponse");

// Inferred types
export type MonthlySummaryResponse = z.infer<
  typeof MonthlySummaryResponseSchema
>;
export type SpendingByCategoryResponse = z.infer<
  typeof SpendingByCategoryResponseSchema
>;
export type UpcomingBillsResponse = z.infer<typeof UpcomingBillsResponseSchema>;
export type NetWorthTrendResponse = z.infer<typeof NetWorthTrendResponseSchema>;
export type SpendingAnalyticsResponse = z.infer<
  typeof SpendingAnalyticsResponseSchema
>;

import { createRoute, z } from "@hono/zod-openapi";
import {
  MonthlySummaryResponseSchema,
  SpendingByCategoryResponseSchema,
  UpcomingBillsResponseSchema,
  NetWorthTrendResponseSchema,
  SpendingAnalyticsResponseSchema,
} from "@pocket-pixie/contracts";

// Schema for loans obligations summary
const LoanObligationsSummarySchema = z.object({
  givenLoans: z
    .number()
    .describe("Total amount of outstanding loans given to others"),
  takenLoans: z
    .number()
    .describe("Total amount of outstanding loans taken from others"),
  netPosition: z.number().describe("Net position (given - taken)"),
  givenCount: z.number().describe("Number of loans given"),
  takenCount: z.number().describe("Number of loans taken"),
});

// Schema for expense shares summary
const ExpenseSharesSummarySchema = z.object({
  asPayer: z
    .number()
    .describe("Total amount of outstanding expense shares as payer"),
  asParticipant: z
    .number()
    .describe("Total amount of outstanding expense shares as participant"),
  netPosition: z.number().describe("Net position (asPayer - asParticipant)"),
  payerCount: z.number().describe("Number of expense shares as payer"),
  participantCount: z
    .number()
    .describe("Number of expense shares as participant"),
});

export const getMonthlySummaryRoute = createRoute({
  method: "get",
  path: "/monthly-summary",
  summary: "Get monthly summary",
  description:
    "Retrieves a consolidated summary for the current month's homepage. " +
    "Uses the following aggregation rules: " +
    "Income: SUM(positive amounts in INCOME accounts); " +
    "Expenses: SUM(positive amounts in EXPENSE accounts); " +
    "Loans Given: NET SUM(all amounts in LOAN_GIVEN accounts); " +
    "Loans Taken: NET SUM(all amounts in LOAN_TAKEN accounts).",
  tags: ["Dashboard"],
  operationId: "getMonthlySummary",
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
    "Gets data points for a net worth trend line over the last 6-12 months. " +
    "Calculates Assets (Loans Given): NET SUM(all amounts in LOAN_GIVEN accounts); " +
    "Liabilities (Loans Taken): NET SUM(all amounts in LOAN_TAKEN accounts); " +
    "Net Worth: Assets - Liabilities. " +
    "Provides monthly snapshots of financial position.",
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

export const getSpendingAnalyticsRoute = createRoute({
  method: "get",
  path: "/spending-analytics",
  summary: "Get spending analytics",
  description:
    "Retrieves detailed spending analytics by category for the current month, with categories sorted by spending amount in descending order. " +
    "Uses aggregation rule: SUM(positive amounts in EXPENSE accounts) grouped by category. " +
    "Follows the double-entry accounting principle where expenses are recorded as positive amounts in expense category accounts.",
  tags: ["Dashboard"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SpendingAnalyticsResponseSchema,
        },
      },
      description: "Spending analytics retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getLoanObligationsSummaryRoute = createRoute({
  method: "get",
  path: "/loan-obligations",
  summary: "Get loan obligations summary",
  description:
    "Gets a summary of loan obligations (both given and taken) using the unified schema.",
  tags: ["Dashboard"],
  operationId: "getLoanObligationsSummary",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LoanObligationsSummarySchema,
        },
      },
      description: "Loan obligations summary retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getExpenseSharesSummaryRoute = createRoute({
  method: "get",
  path: "/expense-shares",
  summary: "Get expense shares summary",
  description:
    "Gets a summary of expense shares (both as payer and participant) using the unified schema.",
  tags: ["Dashboard"],
  operationId: "getExpenseSharesSummary",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExpenseSharesSummarySchema,
        },
      },
      description: "Expense shares summary retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

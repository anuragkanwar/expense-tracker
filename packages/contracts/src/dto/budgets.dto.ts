import { z } from "@hono/zod-openapi";

// Budget status response schema (extends basic budget with spending info)
export const BudgetWithStatusResponseSchema = z
  .object({
    id: z.number().openapi({
      example: 123,
      description: "Unique budget identifier",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
    transactionAccountId: z.number().openapi({
      example: 123,
      description: "Transaction Account ID",
    }),
    amount: z.number().openapi({
      example: 500.0,
      description: "Budget amount",
    }),
    period: z.string().openapi({
      example: "monthly",
      description: "Budget period",
    }),
    startDate: z.string().nullable().openapi({
      example: "2025-09-01T00:00:00.000Z",
      description: "Budget start date",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the budget was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the budget was updated",
    }),
    spent: z.number().openapi({
      example: 450.0,
      description: "Amount spent in this budget period",
    }),
    remaining: z.number().openapi({
      example: 50.0,
      description: "Amount remaining in budget",
    }),
    percentage: z.number().openapi({
      example: 90.0,
      description: "Percentage of budget used",
    }),
  })
  .openapi("BudgetWithStatusResponse");

// Inferred types
export type BudgetWithStatusResponse = z.infer<
  typeof BudgetWithStatusResponseSchema
>;

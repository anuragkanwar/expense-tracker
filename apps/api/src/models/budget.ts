import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { budget, TIME_PERIOD } from "@pocket-pixie/db";
// ==========================================================
// BUDGET SCHEMAS
// ==========================================================

export const BudgetResponseSchema = createSelectSchema(budget)
  .extend({
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
    period: z.enum(TIME_PERIOD).openapi({
      example: "monthly",
      description: "Budget period",
    }),
    startDate: z.string().openapi({
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
  })
  .openapi("BudgetResponse");

export const BudgetCreateSchema = createInsertSchema(budget, {
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 300.0,
    description: "Budget amount",
  }),
  period: z.enum(TIME_PERIOD).openapi({
    example: "monthly",
    description: "Budget period",
  }),
  startDate: z.string().optional().openapi({
    example: "2025-09-01T00:00:00.000Z",
    description: "Budget start date",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID",
  }),
  transactionAccountId: z.number().openapi({
    example: 123,
    description: "Transaction Account ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("BudgetCreate");

export const BudgetUpdateSchema =
  BudgetCreateSchema.partial().openapi("BudgetUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type BudgetResponse = z.infer<typeof BudgetResponseSchema>;
export type BudgetCreate = z.infer<typeof BudgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof BudgetUpdateSchema>;

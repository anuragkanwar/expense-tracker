import { z } from "@hono/zod-openapi";
import { BudgetResponseSchema } from "@/models/budget";

// Budget status response schema (extends basic budget with spending info)
export const BudgetWithStatusResponseSchema = BudgetResponseSchema.extend({
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
}).openapi("BudgetWithStatusResponse");

// Inferred types
export type BudgetWithStatusResponse = z.infer<
  typeof BudgetWithStatusResponseSchema
>;

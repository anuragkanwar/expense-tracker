import { z } from "@hono/zod-openapi";

// Recurring item create schema
export const RecurringItemCreateSchema = z
  .object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description too long")
      .openapi({
        example: "Monthly Netflix subscription",
        description: "Recurring item description",
      }),
    amount: z.number().min(0, "Amount must be positive").openapi({
      example: 15.99,
      description: "Recurring amount",
    }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Recurring type",
    }),
    period: z.enum(["monthly", "weekly", "yearly"]).openapi({
      example: "monthly",
      description: "Recurring period",
    }),
    categoryId: z.string().openapi({
      example: "cat_123",
      description: "Category ID",
    }),
    accountId: z.string().openapi({
      example: "acc_123",
      description: "Account ID",
    }),
    nextDate: z.string().optional().openapi({
      example: "2025-10-01T00:00:00.000Z",
      description: "Next occurrence date",
    }),
  })
  .openapi("RecurringItemCreate");

// Inferred types
export type RecurringItemCreate = z.infer<typeof RecurringItemCreateSchema>;

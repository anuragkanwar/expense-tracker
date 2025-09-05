import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { expense } from "@pocket-pixie/db";

// ==========================================================
// EXPENSE SCHEMAS
// ==========================================================

export const ExpenseResponseSchema = createSelectSchema(expense)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique expense identifier",
    }),
    groupId: z.number().nullable().openapi({
      example: 123,
      description: "Group ID",
    }),
    description: z.string().openapi({
      example: "Dinner at restaurant",
      description: "Expense description",
    }),
    amount: z.number().openapi({
      example: 150.0,
      description: "Expense amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdBy: z.number().openapi({
      example: 123,
      description: "User ID who created the expense",
    }),
    expenseDate: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Date of expense",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was updated",
    }),
  })
  .openapi("ExpenseResponse");

export const ExpenseCreateSchema = createInsertSchema(expense, {
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .openapi({
      example: "Hotel booking",
      description: "Expense description",
    }),
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 200.0,
    description: "Expense amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "EUR",
      description: "Currency code",
    }),
  expenseDate: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Expense date",
  }),
  groupId: z.number().optional().openapi({
    example: 123,
    description: "Group ID",
  }),
  createdBy: z.number().openapi({
    example: 123,
    description: "User ID who created the expense",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpenseCreate");

export const ExpenseUpdateSchema =
  ExpenseCreateSchema.partial().openapi("ExpenseUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type ExpenseResponse = z.infer<typeof ExpenseResponseSchema>;
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseUpdate = z.infer<typeof ExpenseUpdateSchema>;

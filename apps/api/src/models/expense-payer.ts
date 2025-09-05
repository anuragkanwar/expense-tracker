import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { expensePayer } from "@pocket-pixie/db";

// ==========================================================
// EXPENSE PAYER SCHEMAS
// ==========================================================

export const ExpensePayerResponseSchema = createSelectSchema(expensePayer)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique payer identifier",
    }),
    expenseId: z.number().openapi({
      example: 123,
      description: "Expense ID",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID who paid",
    }),
    amountPaid: z.number().openapi({
      example: 75.0,
      description: "Amount paid",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the payer was added",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the payer was updated",
    }),
  })
  .openapi("ExpensePayerResponse");

export const ExpensePayerCreateSchema = createInsertSchema(expensePayer, {
  amountPaid: z.number().min(0, "Amount must be positive").openapi({
    example: 50.0,
    description: "Amount paid",
  }),
  expenseId: z.number().openapi({
    example: 123,
    description: "Expense ID",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID who paid",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpensePayerCreate");

export const ExpensePayerUpdateSchema =
  ExpensePayerCreateSchema.partial().openapi("ExpensePayerUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type ExpensePayerResponse = z.infer<typeof ExpensePayerResponseSchema>;
export type ExpensePayerCreate = z.infer<typeof ExpensePayerCreateSchema>;
export type ExpensePayerUpdate = z.infer<typeof ExpensePayerUpdateSchema>;

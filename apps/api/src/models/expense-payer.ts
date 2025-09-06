import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { expensePayer } from "@/db";

// ==========================================================
// EXPENSE PAYER SCHEMAS
// ==========================================================

export const ExpensePayerResponseSchema = createSelectSchema(expensePayer)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
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

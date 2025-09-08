import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { loan } from "@/db";

// ==========================================================
// LOAN SCHEMAS
// ==========================================================

export const LoanResponseSchema = createSelectSchema(loan)
  .transform((data) => ({
    ...data,
    loanDate: data.loanDate?.toISOString(),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("LoanResponse");

export const LoanCreateSchema = createInsertSchema(loan, {
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
  loanDate: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Loan date",
  }),
  groupId: z.number().optional().openapi({
    example: 123,
    description: "Group ID",
  }),
  createdBy: z.number().openapi({
    example: 123,
    description: "User ID who created the expense",
  }),
  transactionId: z.number().openapi({
    example: 123,
    description: "Transaction ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpenseCreate");

export const LoanUpdateSchema =
  LoanCreateSchema.partial().openapi("LoanUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type LoanCreate = z.infer<typeof LoanCreateSchema>;
export type LoanUpdate = z.infer<typeof LoanUpdateSchema>;

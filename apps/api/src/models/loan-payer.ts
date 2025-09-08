import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { loanPayer } from "@/db";

// ==========================================================
// LOAN PAYER SCHEMAS
// ==========================================================

export const LoanPayerResponseSchema = createSelectSchema(loanPayer)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("LoanPayerResponse");

export const LoanPayerCreateSchema = createInsertSchema(loanPayer, {
  amountPaid: z.number().min(0, "Amount must be positive").openapi({
    example: 50.0,
    description: "Amount paid",
  }),
  loanId: z.number().openapi({
    example: 123,
    description: "Loan ID",
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
  .openapi("LoanPayerCreate");

export const LoanPayerUpdateSchema =
  LoanPayerCreateSchema.partial().openapi("LoanPayerUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type LoanPayerResponse = z.infer<typeof LoanPayerResponseSchema>;
export type LoanPayerCreate = z.infer<typeof LoanPayerCreateSchema>;
export type LoanPayerUpdate = z.infer<typeof LoanPayerUpdateSchema>;

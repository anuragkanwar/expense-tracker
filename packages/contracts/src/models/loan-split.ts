import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { loanSplit, SPLIT_TYPE } from "@pocket-pixie/db-schema";

// ==========================================================
// LOAN SPLIT SCHEMAS
// ==========================================================

export const LoanSplitResponseSchema = createSelectSchema(loanSplit)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("LoanSplitResponse");

export const LoanSplitCreateSchema = createInsertSchema(loanSplit, {
  amountOwed: z.number().min(0, "Amount must be positive").openapi({
    example: 30.0,
    description: "Amount owed",
  }),
  splitType: z.enum(SPLIT_TYPE).optional().openapi({
    example: "percentage",
    description: "Split type",
  }),
  metadata: z
    .any()
    .optional()
    .openapi({
      example: { percentage: 30 },
      description: "Additional split metadata",
    }),
  loanId: z.number().openapi({
    example: 123,
    description: "Loan ID",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID who owes",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("LoanSplitCreate");

export const LoanSplitUpdateSchema =
  LoanSplitCreateSchema.partial().openapi("LoanSplitUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type LoanSplitResponse = z.infer<typeof LoanSplitResponseSchema>;
export type LoanSplitCreate = z.infer<typeof LoanSplitCreateSchema>;
export type LoanSplitUpdate = z.infer<typeof LoanSplitUpdateSchema>;

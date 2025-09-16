import { createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { loan } from "@pocket-pixie/db-schema";

// ==========================================================
// LOAN SCHEMAS
// ==========================================================

// Base (legacy) create schema retained until full refactor & prune
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

// New symmetric direct-loan create schema (creditor/debtor explicit)
export const LoanCreateSymmetricSchema = z
  .object({
    // Creditor is implicitly the authenticated user; client only supplies debtor + context
    debtorId: z.number().int().openapi({
      example: 34,
      description:
        "User ID of debtor (owes money). Must be different from the authenticated user (creditor).",
    }),
    amount: z.number().positive("Amount must be > 0").openapi({
      example: 250.5,
      description: "Principal amount of the loan. Must be positive.",
    }),
    currency: z
      .string()
      .length(3, "Currency must be 3-letter ISO code")
      .openapi({
        example: "USD",
        description: "Currency (ISO 4217). Must be a valid 3-letter code.",
      }),
    groupId: z.number().int().optional().openapi({
      example: 55,
      description:
        "Optional group context. If provided, both users must be members of this group.",
    }),
    // Description is optional; default normalized to empty string to satisfy response contract (non-nullable)
    description: z
      .string()
      .trim()
      .max(500, "Description too long")
      .optional()
      .default("")
      .openapi({
        example: "Trip advance",
        description:
          "Optional description (empty string implied if omitted or blank). Will be normalized.",
      }),
    loanDate: z.string().optional().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "ISO date (defaults to now if omitted).",
    }),
  })
  .openapi("LoanCreateSymmetricRequest");

// Extended loan response including explicit creditor/debtor ids
// (Derived: creditorId = createdBy; debtorId resolved from single split)
export const LoanResponseSchema = z
  .object({
    id: z.number().openapi({ example: 101 }),
    groupId: z.number().nullable().optional().openapi({ example: 55 }),
    description: z.string().openapi({ example: "Trip advance" }),
    amount: z.number().openapi({ example: 250.5 }),
    currency: z.string().openapi({ example: "USD" }),
    createdBy: z.number().openapi({ example: 12 }),
    transactionId: z.number().openapi({ example: 999 }),
    loanDate: z
      .string()
      .optional()
      .openapi({ example: "2025-09-01T12:00:00.000Z" }),
    createdAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
    creditorId: z.number().openapi({ example: 12 }),
    debtorId: z.number().openapi({ example: 34 }),
  })
  .openapi("LoanResponse");

export const LoanUpdateSchema =
  LoanCreateSchema.partial().openapi("LoanUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type LoanCreate = z.infer<typeof LoanCreateSchema>;
export type LoanUpdate = z.infer<typeof LoanUpdateSchema>;
export type LoanCreateSymmetric = z.infer<typeof LoanCreateSymmetricSchema>;
// Input type preserving optional description for caller (since .default() makes output required)
export type LoanCreateSymmetricInput = z.input<
  typeof LoanCreateSymmetricSchema
>;

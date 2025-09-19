import { z } from "@hono/zod-openapi";
import {
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  SPLIT_TYPE,
  SHARE_TYPE,
} from "@pocket-pixie/db-schema";

// ==========================================================
// EXPENSE SHARE SCHEMAS
// ==========================================================

export const ExpenseShareResponseSchema = z
  .object({
    id: z.number().openapi({ example: 101 }),
    transactionId: z.number().openapi({ example: 999 }),
    payerUserId: z.number().openapi({ example: 12 }),
    participantUserId: z.number().openapi({ example: 34 }),
    groupId: z.number().nullable().optional().openapi({ example: 55 }),
    type: z
      .enum([EXPENSE_SHARE_TYPE.EXPENSE, EXPENSE_SHARE_TYPE.LOAN])
      .openapi({ example: EXPENSE_SHARE_TYPE.EXPENSE }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Dinner" }),
    shareType: z
      .enum([SHARE_TYPE.NONE, SHARE_TYPE.GROUP])
      .nullable()
      .optional()
      .openapi({ example: SHARE_TYPE.GROUP }),
    splitType: z
      .enum([SPLIT_TYPE.EQUAL, SPLIT_TYPE.PERCENTAGE, SPLIT_TYPE.SHARE])
      .nullable()
      .optional()
      .openapi({ example: SPLIT_TYPE.EQUAL }),
    expenseAccountId: z
      .number()
      .nullable()
      .optional()
      .openapi({ example: 456 }),
    currency: z.string().openapi({ example: "USD" }),
    amount: z.number().openapi({ example: 250.5 }),
    paidAmount: z.number().openapi({ example: 0 }),
    status: z
      .enum([
        EXPENSE_SHARE_STATUS.UNPAID,
        EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
        EXPENSE_SHARE_STATUS.PAID,
      ])
      .openapi({ example: EXPENSE_SHARE_STATUS.UNPAID }),
    realizedAt: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "2025-09-01T12:00:00.000Z" }),
    loanDate: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "2025-09-01T12:00:00.000Z" }),
    isPayerShare: z.number().openapi({ example: 0 }),
    metadata: z
      .any()
      .optional()
      .openapi({ example: { percentage: 50 } }),
    createdAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
  })
  .openapi("ExpenseShareResponse");

// Loan-specific response schema for API compatibility
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
      .nullable()
      .optional()
      .openapi({ example: "2025-09-01T12:00:00.000Z" }),
    createdAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2025-09-01T12:01:00.000Z" }),
    creditorId: z.number().openapi({ example: 12 }),
    debtorId: z.number().openapi({ example: 34 }),
  })
  .openapi("LoanResponse");

// Symmetric direct-loan create schema (creditor/debtor explicit)
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

export const LoanUpdateSchema = z
  .object({
    description: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    loanDate: z.string().optional(),
  })
  .openapi("LoanUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type ExpenseShareResponse = z.infer<typeof ExpenseShareResponseSchema>;
export type LoanResponse = z.infer<typeof LoanResponseSchema>;
export type LoanCreateSymmetric = z.infer<typeof LoanCreateSymmetricSchema>;
export type LoanUpdate = z.infer<typeof LoanUpdateSchema>;
export type LoanCreateSymmetricInput = z.input<
  typeof LoanCreateSymmetricSchema
>;

// Define loan query filters for consistent query building
export interface LoanFilters {
  userId?: number;
  groupId?: number | null;
  isPersonal?: boolean;
  asCreditor?: boolean;
  asDebtor?: boolean;
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
  friendId?: number;
}

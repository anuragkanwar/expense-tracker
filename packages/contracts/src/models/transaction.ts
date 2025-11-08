import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transaction } from "@pocket-pixie/db-schema";
import { TransactionAccountResponseSchema } from "./transaction-account";

// Transaction Entry with Account details for API responses
export const TransactionEntryWithAccountSchema = z
  .object({
    id: z.number().openapi({ example: 123, description: "Entry ID" }),
    amount: z
      .number()
      .openapi({ example: 25.5, description: "Entry amount (signed)" }),
    transactionAccountId: z
      .number()
      .openapi({ example: 456, description: "Transaction Account ID" }),
    transactionId: z
      .number()
      .openapi({ example: 789, description: "Transaction ID" }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Creation timestamp",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Update timestamp",
    }),
    transactionAccount: TransactionAccountResponseSchema.openapi({
      description: "Transaction account details",
    }),
  })
  .openapi("TransactionEntryWithAccount");

// Enhanced Transaction Response with relevant entry for user
export const TransactionResponseSchema = z
  .object({
    id: z.number().openapi({ example: 123, description: "Transaction ID" }),
    description: z.string().openapi({
      example: "Weekly groceries",
      description: "Transaction description",
    }),
    userId: z.number().openapi({
      example: 456,
      description: "User ID who created the transaction",
    }),
    transactionDate: z.string().optional().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Transaction date",
    }),
    parentTransactionId: z.number().nullable().optional().openapi({
      example: null,
      description: "Parent transaction ID for linked transactions",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Creation timestamp",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Update timestamp",
    }),
    // The most relevant entry for the requesting user
    entry: TransactionEntryWithAccountSchema.openapi({
      description:
        "The most relevant transaction entry for user based on transaction type and user role",
    }),
    // Optional: include both entries for completeness
    entries: z.array(TransactionEntryWithAccountSchema).optional().openapi({
      description:
        "All transaction entries (optional - include if client needs full double-entry view)",
    }),
  })
  .openapi("TransactionResponse");

// Keep the original schema for backward compatibility
export const LegacyTransactionResponseSchema = createSelectSchema(transaction)
  .transform((data) => ({
    ...data,
    transactionDate: data.transactionDate?.toISOString(),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("LegacyTransactionResponse");

export const TransactionCreateSchema = createInsertSchema(transaction, {
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .openapi({
      example: "Weekly groceries",
      description: "Transaction description",
    }),
  transactionDate: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Transaction date",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID",
  }),
  parentTransactionId: z.number().optional().openapi({
    example: 456,
    description:
      "Parent transaction ID for linked transactions (e.g., allocation entries)",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionCreate");

export const TransactionUpdateSchema =
  TransactionCreateSchema.partial().openapi("TransactionUpdate");

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type TransactionEntryWithAccount = z.infer<
  typeof TransactionEntryWithAccountSchema
>;
export type LegacyTransactionResponse = z.infer<
  typeof LegacyTransactionResponseSchema
>;

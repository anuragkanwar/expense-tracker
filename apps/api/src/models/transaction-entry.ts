import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transactionEntry, TXN_TYPE } from "@pocket-pixie/db";

// ==========================================================
// TRANSACTION ENTRY SCHEMAS
// ==========================================================

export const TransactionEntryResponseSchema = createSelectSchema(
  transactionEntry
)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique entry identifier",
    }),
    transactionId: z.number().openapi({
      example: 123,
      description: "Transaction ID",
    }),
    transactionAccountId: z.number().openapi({
      example: 123,
      description: "Account ID",
    }),
    amount: z.number().openapi({
      example: 50.0,
      description: "Entry amount",
    }),
    direction: z.enum(["DEBIT", "CREDIT"]).openapi({
      example: "DEBIT",
      description: "Entry direction",
    }),
    categoryId: z.number().openapi({
      example: 123,
      description: "Category ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the entry was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the entry was updated",
    }),
  })
  .openapi("TransactionEntryResponse");

export const TransactionEntryCreateSchema = createInsertSchema(
  transactionEntry,
  {
    amount: z.number().openapi({
      example: 25.5,
      description: "Entry amount",
    }),
    type: z.enum(TXN_TYPE).openapi({
      example: "Expense, Income, Loan Taken",
      description: "Entry direction",
    }),
    transactionId: z.number().openapi({
      example: 123,
      description: "Transaction ID",
    }),
    transactionAccountId: z.number().openapi({
      example: 123,
      description: "Account ID",
    }),
    categoryId: z.number().openapi({
      example: 123,
      description: "Category ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionEntryCreate");

export const TransactionEntryUpdateSchema =
  TransactionEntryCreateSchema.partial().openapi("TransactionEntryUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type TransactionEntryResponse = z.infer<
  typeof TransactionEntryResponseSchema
>;
export type TransactionEntryCreate = z.infer<
  typeof TransactionEntryCreateSchema
>;
export type TransactionEntryUpdate = z.infer<
  typeof TransactionEntryUpdateSchema
>;

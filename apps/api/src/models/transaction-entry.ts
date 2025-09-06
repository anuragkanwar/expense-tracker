import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transactionEntry, TXN_TYPE } from "@/db";

// ==========================================================
// TRANSACTION ENTRY SCHEMAS
// ==========================================================

export const TransactionEntryResponseSchema = createSelectSchema(
  transactionEntry
)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("TransactionEntryResponse");

export const TransactionEntryCreateSchema = createInsertSchema(
  transactionEntry,
  {
    amount: z.number().openapi({
      example: 25.5,
      description: "Entry amount",
    }),
    transactionId: z.number().openapi({
      example: 123,
      description: "Transaction ID",
    }),
    transactionAccountId: z.number().openapi({
      example: 123,
      description: "Account ID",
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

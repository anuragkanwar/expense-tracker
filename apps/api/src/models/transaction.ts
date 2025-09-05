import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transaction } from "@pocket-pixie/db";

export const TransactionResponseSchema = createSelectSchema(transaction)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique transaction identifier",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
    description: z.string().openapi({
      example: "Grocery shopping",
      description: "Transaction description",
    }),
    transactionDate: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Date of transaction",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the transaction was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the transaction was updated",
    }),
  })
  .openapi("TransactionResponse");

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

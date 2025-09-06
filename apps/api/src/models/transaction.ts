import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transaction } from "@/db";

export const TransactionResponseSchema = createSelectSchema(transaction)
  .transform((data) => ({
    ...data,
    transactionDate: data.transactionDate?.toISOString(),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
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

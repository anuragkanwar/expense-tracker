import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transactionAccount, TXN_CATEGORY } from "@pocket-pixie/db";

export const TransactionAccountResponseSchema = createSelectSchema(
  transactionAccount
)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("TransactionAccountResponse");

export const TransactionAccountCreateSchema = createInsertSchema(
  transactionAccount,
  {
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Chase Checking",
        description: "Account name",
      }),
    category: z.enum(TXN_CATEGORY).openapi({
      example: "bank, food, car, rent, etc...",
      description: "Account type",
    }),
    balance: z.number().min(0, "Balance cannot be negative").openapi({
      example: 0.0,
      description: "Initial balance",
    }),
    currency: z
      .string()
      .min(3, "Currency code required")
      .max(3, "Invalid currency code")
      .openapi({
        example: "USD",
        description: "Currency code",
      }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionAccountCreate");

export const TransactionAccountUpdateSchema =
  TransactionAccountCreateSchema.partial().openapi("TransactionAccountUpdate");

export type TransactionAccountResponse = z.infer<
  typeof TransactionAccountResponseSchema
>;
export type TransactionAccountCreate = z.infer<
  typeof TransactionAccountCreateSchema
>;
export type TransactionAccountUpdate = z.infer<
  typeof TransactionAccountUpdateSchema
>;

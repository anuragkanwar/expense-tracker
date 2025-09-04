import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transactionAccount, TXN_CATEGORY } from "@pocket-pixie/db";

export const TransactionAccountResponseSchema = createSelectSchema(
  transactionAccount
)
  .extend({
    id: z.string().openapi({
      example: "acc_123",
      description: "Unique account identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID owning this account",
    }),
    name: z.string().openapi({
      example: "Main Wallet",
      description: "Account name",
    }),
    type: z.enum(["loan", "budget", "investment"]).openapi({
      example: "budget",
      description: "Account type",
    }),
    balance: z.number().openapi({
      example: 1000.5,
      description: "Current balance",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the account was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the account was updated",
    }),
  })
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
    userId: z.string().openapi({
      example: "user_123",
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

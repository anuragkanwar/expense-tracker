import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { userBalance } from "@pocket-pixie/db";

// ==========================================================
// USER BALANCE SCHEMAS
// ==========================================================

export const UserBalanceResponseSchema = createSelectSchema(userBalance)
  .extend({
    id: z.string().openapi({
      example: "bal_123",
      description: "Unique balance identifier",
    }),
    ownerId: z.string().openapi({
      example: "user_123",
      description: "Owner user ID",
    }),
    counterPartyId: z.string().openapi({
      example: "exp_123",
      description: "Counterparty ID (expense or user)",
    }),
    groupId: z.string().nullable().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    amount: z.number().openapi({
      example: 15.5,
      description: "Balance amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the balance was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the balance was updated",
    }),
  })
  .openapi("UserBalanceResponse");

export const UserBalanceCreateSchema = createInsertSchema(userBalance, {
  amount: z.number().openapi({
    example: 10.0,
    description: "Balance amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "USD",
      description: "Currency code",
    }),
  ownerId: z.string().openapi({
    example: "user_123",
    description: "Owner user ID",
  }),
  counterPartyId: z.string().openapi({
    example: "exp_123",
    description: "Counterparty ID",
  }),
  groupId: z.string().optional().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("UserBalanceCreate");

export const UserBalanceUpdateSchema =
  UserBalanceCreateSchema.partial().openapi("UserBalanceUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type UserBalanceResponse = z.infer<typeof UserBalanceResponseSchema>;
export type UserBalanceCreate = z.infer<typeof UserBalanceCreateSchema>;
export type UserBalanceUpdate = z.infer<typeof UserBalanceUpdateSchema>;

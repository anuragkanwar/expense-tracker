import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { account } from "@pocket-pixie/db";

// ==========================================================
// ACCOUNT SCHEMAS
// ==========================================================

export const AccountResponseSchema = createSelectSchema(account)
  .extend({
    // Add any extensions if needed
  })
  .openapi("AccountResponse");

export const AccountCreateSchema = createInsertSchema(account)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("AccountCreate");

export const AccountUpdateSchema =
  AccountCreateSchema.partial().openapi("AccountUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
export type AccountCreate = z.infer<typeof AccountCreateSchema>;
export type AccountUpdate = z.infer<typeof AccountUpdateSchema>;

import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { settlement } from "@pocket-pixie/db";

// ==========================================================
// SETTLEMENT SCHEMAS
// ==========================================================

export const SettlementResponseSchema = createSelectSchema(settlement)
  .extend({
    id: z.string().openapi({
      example: "set_123",
      description: "Unique settlement identifier",
    }),
    groupId: z.string().nullable().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    payerId: z.string().openapi({
      example: "user_123",
      description: "Payer user ID",
    }),
    payeeId: z.string().openapi({
      example: "user_456",
      description: "Payee user ID",
    }),
    amount: z.number().openapi({
      example: 50.0,
      description: "Settlement amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    setlledAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Settlement date",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the settlement was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the settlement was updated",
    }),
  })
  .openapi("SettlementResponse");

export const SettlementCreateSchema = createInsertSchema(settlement, {
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 25.0,
    description: "Settlement amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "USD",
      description: "Currency code",
    }),
  setlledAt: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Settlement date",
  }),
  groupId: z.string().optional().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
  payerId: z.string().openapi({
    example: "user_123",
    description: "Payer user ID",
  }),
  payeeId: z.string().openapi({
    example: "user_456",
    description: "Payee user ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("SettlementCreate");

export const SettlementUpdateSchema =
  SettlementCreateSchema.partial().openapi("SettlementUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type SettlementResponse = z.infer<typeof SettlementResponseSchema>;
export type SettlementCreate = z.infer<typeof SettlementCreateSchema>;
export type SettlementUpdate = z.infer<typeof SettlementUpdateSchema>;

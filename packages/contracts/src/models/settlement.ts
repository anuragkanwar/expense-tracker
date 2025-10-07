import { z } from "@hono/zod-openapi";
// We don't directly use the settlement schema, but include this comment
// to document that these schemas are based on the settlement table structure
// defined in @pocket-pixie/db-schema

// ==========================================================
// SETTLEMENT SCHEMAS
// ==========================================================

// Define response schema with explicit types for API responses
export const SettlementResponseSchema = z
  .object({
    id: z.number().openapi({
      example: 123,
      description: "Unique settlement identifier",
    }),
    groupId: z.number().nullable().openapi({
      example: 123,
      description: "Group ID",
    }),
    payerId: z.number().openapi({
      example: 123,
      description: "Payer user ID (debtor / participant paying)",
    }),
    payeeId: z.number().openapi({
      example: 123,
      description: "Payee user ID (original payer receiving)",
    }),
    amount: z.number().openapi({
      example: 50.0,
      description: "Settlement amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    transactionId: z
      .number()
      .nullable()
      .openapi({ example: 555, description: "Linked ledger transaction id" }),
    idempotencyKey: z
      .string()
      .nullable()
      .openapi({ example: "alloc-req-uuid", description: "Idempotency key" }),
    settledAt: z.string().openapi({
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

export const SettlementCreateSchema = z
  .object({
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
    settledAt: z.string().optional().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Settlement date",
    }),
    groupId: z.number().optional().openapi({
      example: 123,
      description: "Group ID",
    }),
    payerId: z.number().openapi({
      example: 123,
      description: "Payer user ID (debtor / participant paying)",
    }),
    payeeId: z.number().openapi({
      example: 123,
      description: "Payee user ID (original payer receiving)",
    }),
    transactionId: z
      .number()
      .nullable()
      .optional()
      .openapi({ example: 555, description: "Linked ledger transaction id" }),
    idempotencyKey: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "alloc-req-uuid", description: "Idempotency key" }),
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

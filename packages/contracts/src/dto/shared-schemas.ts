import { z } from "zod";

// Common numeric ID (positive int) used across params
export const IdParamSchema = z.coerce.number().int().positive();

export const UserIdParamSchema = IdParamSchema;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const MonetaryAmountSchema = z.coerce
  .number()
  .finite()
  .refine((v) => Math.abs(v) < 1_000_000_000, {
    message: "Amount too large",
  });

export const MessageResponseSchema = z.object({
  message: z.string(),
});

export const SettlementMessageResponseSchema = MessageResponseSchema;

export const DeletionMessageResponseSchema = MessageResponseSchema;

// -------------------------------------------------------------
// Standardized Error Schemas
// -------------------------------------------------------------

export const StandardErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// Differences map used for idempotency conflict errors
const IdempotencyDifferenceValueSchema = z.object({
  original: z.any(),
  attempted: z.any(),
});

export const IdempotencyConflictErrorSchema = StandardErrorSchema.extend({
  error: StandardErrorSchema.shape.error.extend({
    differences: z
      .record(z.string(), IdempotencyDifferenceValueSchema)
      .optional(),
  }),
});

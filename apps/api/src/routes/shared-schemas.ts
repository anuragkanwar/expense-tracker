import { z } from "@hono/zod-openapi";

// Common numeric ID (positive int) used across params
export const IdParamSchema = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ example: 123, description: "Positive integer identifier" });

export const UserIdParamSchema = IdParamSchema.openapi({
  example: 456,
  description: "User ID",
});

export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .openapi({ example: 1, description: "Page number (1-indexed)" }),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .openapi({ example: 20, description: "Results per page (max 100)" }),
});

export const MonetaryAmountSchema = z.coerce
  .number()
  .finite()
  .refine((v) => Math.abs(v) < 1_000_000_000, {
    message: "Amount too large",
  })
  .openapi({ example: 19.99, description: "Monetary amount" });

export const MessageResponseSchema = z.object({
  message: z.string().openapi({ example: "Operation successful" }),
});

export const SettlementMessageResponseSchema = MessageResponseSchema.openapi({
  example: { message: "Settlement recorded successfully" },
});

export const DeletionMessageResponseSchema = MessageResponseSchema.openapi({
  example: { message: "Resource deleted successfully" },
});

// -------------------------------------------------------------
// Standardized Error Schemas (shared across OpenAPI contracts)
// -------------------------------------------------------------

export const StandardErrorSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.object({
      code: z.string().openapi({ example: "BAD_REQUEST" }),
      message: z.string().openapi({ example: "Invalid request" }),
    }),
  })
  .openapi({ description: "Standard error response wrapper" });

// Differences map used for idempotency conflict errors
const IdempotencyDifferenceValueSchema = z.object({
  original: z.any().openapi({ example: 100 }),
  attempted: z.any().openapi({ example: 120 }),
});

export const IdempotencyConflictErrorSchema = StandardErrorSchema.extend({
  error: StandardErrorSchema.shape.error.extend({
    differences: z
      .record(z.string(), IdempotencyDifferenceValueSchema)
      .optional()
      .openapi({
        example: {
          amount: { original: 100, attempted: 120 },
          currency: { original: "USD", attempted: "EUR" },
        },
        description:
          "Field-level differences between the original idempotent request payload and the conflicting replay attempt",
      }),
  }),
}).openapi({
  description:
    "Idempotency conflict error with field differences. " +
    "Occurs when an Idempotency-Key is reused with a different payload. " +
    "Per LLD section 16.1, idempotency keys are REQUIRED for all settlement operations " +
    "and have uniqueness scope of (userId, idempotencyKey, endpoint).",
});

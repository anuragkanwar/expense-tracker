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

import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { RECURRENCE_TYPE, TIME_PERIOD, recurring } from "@/db";

// ==========================================================
// RECURRING SCHEMAS
// ==========================================================

export const RecurringResponseSchema = createSelectSchema(recurring)
  .transform((data) => ({
    ...data,
    nextDate: data.nextDate?.toISOString(),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
  .openapi("RecurringResponse");

export const RecurringCreateSchema = createInsertSchema(recurring, {
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .openapi({
      example: "Salary deposit",
      description: "Recurring description",
    }),
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 3000.0,
    description: "Recurring amount",
  }),
  period: z.enum(TIME_PERIOD).openapi({
    example: "MONTHLY",
    description: "Recurring period",
  }),
  type: z.enum(RECURRENCE_TYPE).openapi({
    example: "CREDIT",
    description: "Recurring type",
  }),
  nextDate: z.string().optional().openapi({
    example: "2025-10-01T00:00:00.000Z",
    description: "Next occurrence date",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID",
  }),
  sourceTransactionAccountID: z.number().openapi({
    example: 123,
    description: "Source account ID",
  }),
  targetTransactionAccountID: z.number().openapi({
    example: 456,
    description: "Target account ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("RecurringCreate");

export const RecurringUpdateSchema =
  RecurringCreateSchema.partial().openapi("RecurringUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type RecurringResponse = z.infer<typeof RecurringResponseSchema>;
export type RecurringCreate = z.infer<typeof RecurringCreateSchema>;
export type RecurringUpdate = z.infer<typeof RecurringUpdateSchema>;

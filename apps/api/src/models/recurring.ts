import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { RECURRENCE_TYPE, recurring } from "@pocket-pixie/db";

// ==========================================================
// RECURRING SCHEMAS
// ==========================================================

export const RecurringResponseSchema = createSelectSchema(recurring)
  .extend({
    id: z.string().openapi({
      example: "rec_123",
      description: "Unique recurring identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
    sourcetransactionAccountID: z.string().openapi({
      example: "acc_123",
      description: "Source account ID",
    }),
    targettransactionAccountID: z.string().openapi({
      example: "acc_456",
      description: "Target account ID",
    }),
    description: z.string().openapi({
      example: "Monthly rent",
      description: "Recurring description",
    }),
    amount: z.number().openapi({
      example: 1200.0,
      description: "Recurring amount",
    }),
    period: z.enum(["monthly", "weekly", "yearly"]).openapi({
      example: "monthly",
      description: "Recurring period",
    }),
    type: z.enum(RECURRENCE_TYPE).openapi({
      example: "DEBIT",
      description: "Recurring type",
    }),
    nextDate: z.string().openapi({
      example: "2025-10-01T00:00:00.000Z",
      description: "Next occurrence date",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the recurring was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the recurring was updated",
    }),
  })
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
  period: z.enum(["monthly", "weekly", "yearly"]).openapi({
    example: "monthly",
    description: "Recurring period",
  }),
  type: z.enum(["CREDIT", "DEBIT"]).openapi({
    example: "CREDIT",
    description: "Recurring type",
  }),
  nextDate: z.string().optional().openapi({
    example: "2025-10-01T00:00:00.000Z",
    description: "Next occurrence date",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID",
  }),
  sourcetransactionAccountID: z.string().openapi({
    example: "acc_123",
    description: "Source account ID",
  }),
  targettransactionAccountID: z.string().openapi({
    example: "acc_456",
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

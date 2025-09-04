import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { expenseSplit, SPLIT_TYPE } from "@pocket-pixie/db";

// ==========================================================
// EXPENSE SPLIT SCHEMAS
// ==========================================================

export const ExpenseSplitResponseSchema = createSelectSchema(expenseSplit)
  .extend({
    id: z.string().openapi({
      example: "spl_123",
      description: "Unique split identifier",
    }),
    expenseId: z.string().openapi({
      example: "exp_123",
      description: "Expense ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID who owes",
    }),
    amountOwed: z.number().openapi({
      example: 25.0,
      description: "Amount owed",
    }),
    splitType: z.enum(SPLIT_TYPE).nullable().openapi({
      example: "Equal",
      description: "Split type",
    }),
    metadata: z
      .any()
      .nullable()
      .openapi({
        example: { percentage: 50 },
        description: "Additional split metadata",
      }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the split was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the split was updated",
    }),
  })
  .openapi("ExpenseSplitResponse");

export const ExpenseSplitCreateSchema = createInsertSchema(expenseSplit, {
  amountOwed: z.number().min(0, "Amount must be positive").openapi({
    example: 30.0,
    description: "Amount owed",
  }),
  splitType: z.enum(SPLIT_TYPE).optional().openapi({
    example: "percentage",
    description: "Split type",
  }),
  metadata: z
    .any()
    .optional()
    .openapi({
      example: { percentage: 30 },
      description: "Additional split metadata",
    }),
  expenseId: z.string().openapi({
    example: "exp_123",
    description: "Expense ID",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID who owes",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpenseSplitCreate");

export const ExpenseSplitUpdateSchema =
  ExpenseSplitCreateSchema.partial().openapi("ExpenseSplitUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type ExpenseSplitResponse = z.infer<typeof ExpenseSplitResponseSchema>;
export type ExpenseSplitCreate = z.infer<typeof ExpenseSplitCreateSchema>;
export type ExpenseSplitUpdate = z.infer<typeof ExpenseSplitUpdateSchema>;

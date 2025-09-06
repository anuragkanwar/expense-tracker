import { z } from "@hono/zod-openapi";
import { ExpenseResponseSchema, ExpenseCreateSchema } from "@/models/expense";
import { ExpenseSplitCreateSchema } from "@/models/expense-split";
import {
  SHARE_TYPE,
  SPLIT_TYPE,
  TXN_CATEGORY,
  TXN_TYPE,
} from "@/db";

// Complex schema for creating expense with payers and splits
export const ExpenseCreateWithDetailsSchema = z
  .object({
    description: ExpenseCreateSchema.shape.description,
    amount: ExpenseCreateSchema.shape.amount,
    groupId: ExpenseCreateSchema.shape.groupId,
    expenseDate: ExpenseCreateSchema.shape.expenseDate,
    type: z.enum(TXN_TYPE),
    payer: z.string().optional().openapi({
      description: "user who paid for the transaction",
    }),
    sharedWith: z.enum(SHARE_TYPE).openapi({
      description: "is transaction shared with other parties",
    }),
    splitType: z.enum(SPLIT_TYPE).optional().openapi({
      example: "percentage",
      description: "Split type",
    }),
    sourceTransactionAccountID: z.number().openapi({
      example: 123,
      description: "Source account ID",
    }),
    targetTransactionAccountID: z.number().openapi({
      example: 456,
      description: "Target account ID",
    }),
    splits: z
      .array(
        ExpenseSplitCreateSchema.omit({
          expenseId: true,
          splitType: true,
          metadata: true,
        }) // expenseId will be set after creation
      )
      .optional()
      .openapi({
        description: "How the transaction is split among participants",
      }),
  })
  .openapi("ExpenseCreateWithDetails");

// Schema for creating expense with AI prompt
export const ExpenseCreateWithAIPromptSchema = z
  .object({
    userPrompt: z.string().min(1, "User prompt is required").openapi({
      example:
        "paid 4000 for dinner with #some-splitwise-group and also @some-people1, @some-people2",
      description: "Natural language description of the expense",
    }),
    groupIds: z
      .array(z.number())
      .optional()
      .openapi({
        example: [123],
        description: "Optional list of group IDs mentioned in the prompt",
      }),
    userIds: z
      .array(z.number())
      .optional()
      .openapi({
        example: [456, 789],
        description: "Optional list of user IDs mentioned in the prompt",
      }),
  })
  .openapi("ExpenseCreateWithAIPrompt");

export const ExpenseUpdateWithDetailsSchema =
  ExpenseCreateWithDetailsSchema.partial().openapi("ExpenseUpdateWithDetails");

// Response schema for expense with details
export const ExpenseWithDetailsResponseSchema = z
  .object({
    id: z.number().openapi({
      example: 123,
      description: "Unique expense identifier",
    }),
    groupId: z.number().nullable().openapi({
      example: 123,
      description: "Group ID",
    }),
    description: z.string().openapi({
      example: "Dinner at restaurant",
      description: "Expense description",
    }),
    amount: z.number().openapi({
      example: 150.0,
      description: "Expense amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdBy: z.number().openapi({
      example: 123,
      description: "User ID who created the expense",
    }),
    expenseDate: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Date of expense",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was updated",
    }),
    payers: z
      .array(
        z.object({
          userId: z.number(),
          amountPaid: z.number(),
        })
      )
      .openapi({
        description: "List of payers with amounts",
      }),
    splits: z
      .array(
        z.object({
          userId: z.number(),
          amountOwed: z.number(),
          splitType: z.enum(SPLIT_TYPE).nullable(),
          metadata: z.any().nullable(),
        })
      )
      .openapi({
        description: "List of splits with details",
      }),
  })
  .openapi("ExpenseWithDetailsResponse");
// Pagination schema
export const ExpenseListResponseSchema = z
  .object({
    expenses: z.array(ExpenseResponseSchema),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 10 }),
  })
  .openapi("ExpenseListResponse");

// Inferred types
export type ExpenseCreateWithDetails = z.infer<
  typeof ExpenseCreateWithDetailsSchema
>;
export type ExpenseCreateWithAIPrompt = z.infer<
  typeof ExpenseCreateWithAIPromptSchema
>;
export type ExpenseUpdateWithDetails = z.infer<
  typeof ExpenseUpdateWithDetailsSchema
>;
export type ExpenseWithDetailsResponse = z.infer<
  typeof ExpenseWithDetailsResponseSchema
>;
export type ExpenseListResponse = z.infer<typeof ExpenseListResponseSchema>;

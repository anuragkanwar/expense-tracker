import { z } from "@hono/zod-openapi";
// Import from the unified expense-share model
import {
  LoanResponseSchema,
  LoanCreateSchema,
} from "../models/expense-share";
import { SHARE_TYPE, SPLIT_TYPE, TXN_TYPE } from "@pocket-pixie/db-schema";

// Complex schema for creating transaction with payers and splits
export const TransactionCreateWithDetailsSchema = z
  .object({
    description: LoanCreateSchema.shape.description,
    amount: LoanCreateSchema.shape.amount,
    groupId: LoanCreateSchema.shape.groupId,
    loanDate: LoanCreateSchema.shape.loanDate,
    type: z.enum(TXN_TYPE),
    payer: z.number().openapi({
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
        z.object({
          userId: z.number().int(),
          amount: z.number().positive(),
          percentage: z.number().optional(),
        })
      )
      .optional()
      .openapi({
        description: "How the transaction is split among participants",
      }),
  })
  .openapi("TransactionCreateWithDetails");

// Schema for creating transaction with AI prompt
export const TransactionCreateWithAIPromptSchema = z
  .object({
    userPrompt: z.string().min(1, "User prompt is required").openapi({
      example:
        "paid 4000 for dinner with #some-splitwise-group and also @some-people1, @some-people2",
      description: "Natural language description of the transaction",
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
  .openapi("TransactionCreateWithAIPrompt");

export const TransactionUpdateWithDetailsSchema =
  TransactionCreateWithDetailsSchema.partial().openapi(
    "TransactionUpdateWithDetails"
  );

// Response schema for transaction with details
export const TransactionWithDetailsResponseSchema = z
  .object({
    id: z.number().openapi({
      example: 123,
      description: "Unique transaction identifier",
    }),
    groupId: z.number().nullable().openapi({
      example: 123,
      description: "Group ID",
    }),
    description: z.string().openapi({
      example: "Dinner at restaurant",
      description: "Transaction description",
    }),
    amount: z.number().openapi({
      example: 150.0,
      description: "Transaction amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdBy: z.number().openapi({
      example: 123,
      description: "User ID who created the transaction",
    }),
    loanDate: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Date of transaction",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the transaction was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the transaction was updated",
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
  .openapi("TransactionWithDetailsResponse");
// Pagination schema
export const TransactionListResponseSchema = z
  .object({
    transactions: z.array(LoanResponseSchema),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 10 }),
  })
  .openapi("TransactionListResponse");

// Inferred types
export type TransactionCreateWithDetails = z.infer<
  typeof TransactionCreateWithDetailsSchema
>;
export type TransactionCreateWithAIPrompt = z.infer<
  typeof TransactionCreateWithAIPromptSchema
>;
export type TransactionUpdateWithDetails = z.infer<
  typeof TransactionUpdateWithDetailsSchema
>;
export type TransactionWithDetailsResponse = z.infer<
  typeof TransactionWithDetailsResponseSchema
>;
export type TransactionListResponse = z.infer<
  typeof TransactionListResponseSchema
>;

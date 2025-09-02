import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import {
  transactionAccount,
  transaction,
  transactionCategory,
  transactionEntry,
  budget,
  recurring,
} from "@pocket-pixie/db";

// ==========================================================
// TRANSACTION ACCOUNT SCHEMAS
// ==========================================================

export const TransactionAccountResponseSchema = createSelectSchema(
  transactionAccount
)
  .extend({
    id: z.string().openapi({
      example: "acc_123",
      description: "Unique account identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID owning this account",
    }),
    name: z.string().openapi({
      example: "Main Wallet",
      description: "Account name",
    }),
    type: z.enum(["loan", "budget", "investment"]).openapi({
      example: "budget",
      description: "Account type",
    }),
    balance: z.number().openapi({
      example: 1000.5,
      description: "Current balance",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the account was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the account was updated",
    }),
  })
  .openapi("TransactionAccountResponse");

export const TransactionAccountCreateSchema = createInsertSchema(
  transactionAccount,
  {
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Chase Checking",
        description: "Account name",
      }),
    type: z.enum(["loan", "budget", "investment"]).openapi({
      example: "budget",
      description: "Account type",
    }),
    balance: z.number().min(0, "Balance cannot be negative").openapi({
      example: 0.0,
      description: "Initial balance",
    }),
    currency: z
      .string()
      .min(3, "Currency code required")
      .max(3, "Invalid currency code")
      .openapi({
        example: "USD",
        description: "Currency code",
      }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionAccountCreate");

export const TransactionAccountUpdateSchema =
  TransactionAccountCreateSchema.partial().openapi("TransactionAccountUpdate");

// ==========================================================
// TRANSACTION SCHEMAS
// ==========================================================

export const TransactionResponseSchema = createSelectSchema(transaction)
  .extend({
    id: z.string().openapi({
      example: "txn_123",
      description: "Unique transaction identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
    description: z.string().openapi({
      example: "Grocery shopping",
      description: "Transaction description",
    }),
    transactionDate: z.string().openapi({
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
  })
  .openapi("TransactionResponse");

export const TransactionCreateSchema = createInsertSchema(transaction, {
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .openapi({
      example: "Weekly groceries",
      description: "Transaction description",
    }),
  transactionDate: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Transaction date",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionCreate");

export const TransactionUpdateSchema =
  TransactionCreateSchema.partial().openapi("TransactionUpdate");

// ==========================================================
// TRANSACTION CATEGORY SCHEMAS
// ==========================================================

export const TransactionCategoryResponseSchema = createSelectSchema(
  transactionCategory
)
  .extend({
    id: z.string().openapi({
      example: "cat_123",
      description: "Unique category identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
    name: z.string().openapi({
      example: "Food",
      description: "Category name",
    }),
    parentCategoryId: z.string().nullable().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the category was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the category was updated",
    }),
  })
  .openapi("TransactionCategoryResponse");

export const TransactionCategoryCreateSchema = createInsertSchema(
  transactionCategory,
  {
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Groceries",
        description: "Category name",
      }),
    parentCategoryId: z.string().optional().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionCategoryCreate");

export const TransactionCategoryUpdateSchema =
  TransactionCategoryCreateSchema.partial().openapi(
    "TransactionCategoryUpdate"
  );

// ==========================================================
// TRANSACTION ENTRY SCHEMAS
// ==========================================================

export const TransactionEntryResponseSchema = createSelectSchema(
  transactionEntry
)
  .extend({
    id: z.string().openapi({
      example: "entry_123",
      description: "Unique entry identifier",
    }),
    transactionId: z.string().openapi({
      example: "txn_123",
      description: "Transaction ID",
    }),
    transactionAccountId: z.string().openapi({
      example: "acc_123",
      description: "Account ID",
    }),
    amount: z.number().openapi({
      example: 50.0,
      description: "Entry amount",
    }),
    direction: z.enum(["DEBIT", "CREDIT"]).openapi({
      example: "DEBIT",
      description: "Entry direction",
    }),
    categoryId: z.string().openapi({
      example: "cat_123",
      description: "Category ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the entry was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the entry was updated",
    }),
  })
  .openapi("TransactionEntryResponse");

export const TransactionEntryCreateSchema = createInsertSchema(
  transactionEntry,
  {
    amount: z.number().openapi({
      example: 25.5,
      description: "Entry amount",
    }),
    direction: z.enum(["DEBIT", "CREDIT"]).openapi({
      example: "DEBIT",
      description: "Entry direction",
    }),
    transactionId: z.string().openapi({
      example: "txn_123",
      description: "Transaction ID",
    }),
    transactionAccountId: z.string().openapi({
      example: "acc_123",
      description: "Account ID",
    }),
    categoryId: z.string().openapi({
      example: "cat_123",
      description: "Category ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionEntryCreate");

export const TransactionEntryUpdateSchema =
  TransactionEntryCreateSchema.partial().openapi("TransactionEntryUpdate");

// ==========================================================
// BUDGET SCHEMAS
// ==========================================================

export const BudgetResponseSchema = createSelectSchema(budget)
  .extend({
    id: z.string().openapi({
      example: "bud_123",
      description: "Unique budget identifier",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
    categoryId: z.string().openapi({
      example: "cat_123",
      description: "Category ID",
    }),
    amount: z.number().openapi({
      example: 500.0,
      description: "Budget amount",
    }),
    period: z.enum(["monthly", "weekly", "yearly"]).openapi({
      example: "monthly",
      description: "Budget period",
    }),
    startDate: z.string().openapi({
      example: "2025-09-01T00:00:00.000Z",
      description: "Budget start date",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the budget was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the budget was updated",
    }),
  })
  .openapi("BudgetResponse");

export const BudgetCreateSchema = createInsertSchema(budget, {
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 300.0,
    description: "Budget amount",
  }),
  period: z.enum(["monthly", "weekly", "yearly"]).openapi({
    example: "monthly",
    description: "Budget period",
  }),
  startDate: z.string().optional().openapi({
    example: "2025-09-01T00:00:00.000Z",
    description: "Budget start date",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID",
  }),
  categoryId: z.string().openapi({
    example: "cat_123",
    description: "Category ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("BudgetCreate");

export const BudgetUpdateSchema =
  BudgetCreateSchema.partial().openapi("BudgetUpdate");

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
    type: z.enum(["CREDIT", "DEBIT"]).openapi({
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
export type TransactionAccountResponse = z.infer<
  typeof TransactionAccountResponseSchema
>;
export type TransactionAccountCreate = z.infer<
  typeof TransactionAccountCreateSchema
>;
export type TransactionAccountUpdate = z.infer<
  typeof TransactionAccountUpdateSchema
>;

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;

export type TransactionCategoryResponse = z.infer<
  typeof TransactionCategoryResponseSchema
>;
export type TransactionCategoryCreate = z.infer<
  typeof TransactionCategoryCreateSchema
>;
export type TransactionCategoryUpdate = z.infer<
  typeof TransactionCategoryUpdateSchema
>;

export type TransactionEntryResponse = z.infer<
  typeof TransactionEntryResponseSchema
>;
export type TransactionEntryCreate = z.infer<
  typeof TransactionEntryCreateSchema
>;
export type TransactionEntryUpdate = z.infer<
  typeof TransactionEntryUpdateSchema
>;

export type BudgetResponse = z.infer<typeof BudgetResponseSchema>;
export type BudgetCreate = z.infer<typeof BudgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof BudgetUpdateSchema>;

export type RecurringResponse = z.infer<typeof RecurringResponseSchema>;
export type RecurringCreate = z.infer<typeof RecurringCreateSchema>;
export type RecurringUpdate = z.infer<typeof RecurringUpdateSchema>;

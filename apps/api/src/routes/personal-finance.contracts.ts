import { createRoute, z } from "@hono/zod-openapi";
import {
  TransactionAccountResponseSchema,
  TransactionAccountCreateSchema,
} from "@/models/transaction-account";
import { BudgetResponseSchema, BudgetCreateSchema } from "@/models/budget";
import { RecurringResponseSchema } from "@/models/recurring";

// Category response schema
export const CategoryResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "cat_123",
      description: "Unique category identifier",
    }),
    name: z.string().openapi({
      example: "Food & Dining",
      description: "Category name",
    }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Category type",
    }),
    parentCategoryId: z.string().nullable().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
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
  .openapi("CategoryResponse");

// Category create schema
export const CategoryCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Groceries",
        description: "Category name",
      }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Category type",
    }),
    parentCategoryId: z.string().optional().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
  })
  .openapi("CategoryCreate");

// Recurring item create schema
export const RecurringItemCreateSchema = z
  .object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description too long")
      .openapi({
        example: "Monthly Netflix subscription",
        description: "Recurring item description",
      }),
    amount: z.number().min(0, "Amount must be positive").openapi({
      example: 15.99,
      description: "Recurring amount",
    }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Recurring type",
    }),
    period: z.enum(["monthly", "weekly", "yearly"]).openapi({
      example: "monthly",
      description: "Recurring period",
    }),
    categoryId: z.string().openapi({
      example: "cat_123",
      description: "Category ID",
    }),
    accountId: z.string().openapi({
      example: "acc_123",
      description: "Account ID",
    }),
    nextDate: z.string().optional().openapi({
      example: "2025-10-01T00:00:00.000Z",
      description: "Next occurrence date",
    }),
  })
  .openapi("RecurringItemCreate");

// Accounts routes
export const createAccountRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create account",
  description:
    "Creates a new financial account (e.g., adding a new credit card).",
  tags: ["Personal Finance"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TransactionAccountCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getAccountRoute = createRoute({
  method: "get",
  path: "/{accountId}",
  summary: "Get account details",
  description: "Retrieves details for a single financial account.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

export const updateAccountRoute = createRoute({
  method: "put",
  path: "/{accountId}",
  summary: "Update account",
  description: "Updates a financial account.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: TransactionAccountCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionAccountResponseSchema,
        },
      },
      description: "Account updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

export const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/{accountId}",
  summary: "Delete account",
  description: "Deletes a financial account.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      accountId: z.string().openapi({
        example: "acc_123",
        description: "Account ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Account deleted successfully" }),
          }),
        },
      },
      description: "Account deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Account not found" },
  },
});

// Categories routes
export const getCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List categories",
  description:
    "Lists all available transaction categories (both income and expense).",
  tags: ["Personal Finance"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(CategoryResponseSchema).openapi({
            description: "List of categories",
          }),
        },
      },
      description: "Categories retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create category",
  description: "Creates a new custom category.",
  tags: ["Personal Finance"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CategoryCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
      description: "Category created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const updateCategoryRoute = createRoute({
  method: "put",
  path: "/{categoryId}",
  summary: "Update category",
  description: "Updates a custom category.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      categoryId: z.string().openapi({
        example: "cat_123",
        description: "Category ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: CategoryCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
      description: "Category updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Category not found" },
  },
});

export const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{categoryId}",
  summary: "Delete category",
  description: "Deletes a custom category.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      categoryId: z.string().openapi({
        example: "cat_123",
        description: "Category ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Category deleted successfully" }),
          }),
        },
      },
      description: "Category deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Category not found" },
  },
});

// Budgets routes
export const getBudgetRoute = createRoute({
  method: "get",
  path: "/{budgetId}",
  summary: "Get budget details",
  description: "Retrieves details for a single budget.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      budgetId: z.string().openapi({
        example: "bud_123",
        description: "Budget ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BudgetResponseSchema,
        },
      },
      description: "Budget details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Budget not found" },
  },
});

export const updateBudgetRoute = createRoute({
  method: "put",
  path: "/{budgetId}",
  summary: "Update budget",
  description: "Updates a budget.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      budgetId: z.string().openapi({
        example: "bud_123",
        description: "Budget ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: BudgetCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BudgetResponseSchema,
        },
      },
      description: "Budget updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Budget not found" },
  },
});

export const deleteBudgetRoute = createRoute({
  method: "delete",
  path: "/{budgetId}",
  summary: "Delete budget",
  description: "Deletes a budget.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      budgetId: z.string().openapi({
        example: "bud_123",
        description: "Budget ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Budget deleted successfully" }),
          }),
        },
      },
      description: "Budget deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Budget not found" },
  },
});

// Recurring items routes
export const getRecurringItemsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List recurring items",
  description: "Lists all recurring items (income and expenses).",
  tags: ["Personal Finance"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(RecurringResponseSchema).openapi({
            description: "List of recurring items",
          }),
        },
      },
      description: "Recurring items retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createRecurringItemRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create recurring item",
  description: "Creates a new recurring item.",
  tags: ["Personal Finance"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RecurringItemCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getRecurringItemRoute = createRoute({
  method: "get",
  path: "/{itemId}",
  summary: "Get recurring item details",
  description: "Retrieves details for a single recurring item.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

export const updateRecurringItemRoute = createRoute({
  method: "put",
  path: "/{itemId}",
  summary: "Update recurring item",
  description: "Updates a recurring item.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: RecurringItemCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

export const deleteRecurringItemRoute = createRoute({
  method: "delete",
  path: "/{itemId}",
  summary: "Delete recurring item",
  description: "Deletes a recurring item.",
  tags: ["Personal Finance"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Recurring item deleted successfully" }),
          }),
        },
      },
      description: "Recurring item deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

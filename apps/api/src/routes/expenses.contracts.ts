import {
  ExpenseResponseSchema,
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
} from "@/models/expense";
import { ExpensePayerCreateSchema } from "@/models/expense-payer";
import { ExpenseSplitCreateSchema } from "@/models/expense-split";
import { createRoute, z } from "@hono/zod-openapi";

// Complex schema for creating expense with payers and splits
export const ExpenseCreateWithDetailsSchema = z
  .object({
    description: ExpenseCreateSchema.shape.description,
    amount: ExpenseCreateSchema.shape.amount,
    groupId: ExpenseCreateSchema.shape.groupId,
    expenseDate: ExpenseCreateSchema.shape.expenseDate,
    payer: z.string().openapi({
      description: "user who paid for the expense",
    }),
    sharedWith: z.enum(["None", "Group", "Friends"]).openapi({
      description: "is expense shared with other parties",
    }),
    splitType: z.enum(["Equal", "Exact", "percentage"]).optional().openapi({
      example: "percentage",
      description: "Split type",
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
        description: "How the expense is split among participants",
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
      .array(z.string())
      .optional()
      .openapi({
        example: ["grp_123"],
        description: "Optional list of group IDs mentioned in the prompt",
      }),
    userIds: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["user_456", "user_789"],
        description: "Optional list of user IDs mentioned in the prompt",
      }),
  })
  .openapi("ExpenseCreateWithAIPrompt");

export const ExpenseUpdateWithDetailsSchema =
  ExpenseCreateWithDetailsSchema.partial().openapi("ExpenseUpdateWithDetails");

// Response schema for expense with details
export const ExpenseWithDetailsResponseSchema = ExpenseResponseSchema.extend({
  payers: z
    .array(
      z.object({
        userId: z.string(),
        amountPaid: z.number(),
      })
    )
    .openapi({
      description: "List of payers with amounts",
    }),
  splits: z
    .array(
      z.object({
        userId: z.string(),
        amountOwed: z.number(),
        splitType: z.enum(["Equal", "Exact", "percentage", "share"]).nullable(),
        metadata: z.any().nullable(),
      })
    )
    .openapi({
      description: "List of splits with details",
    }),
}).openapi("ExpenseWithDetailsResponse");

// Pagination schema
export const ExpenseListResponseSchema = z
  .object({
    expenses: z.array(ExpenseResponseSchema),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 10 }),
  })
  .openapi("ExpenseListResponse");

export const createExpenseRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new expense",
  description:
    "Creates a new expense with payers and split details. The request includes total amount, payer(s), and split object specifying the type and data for each participant.",
  tags: ["Expenses"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ExpenseCreateWithDetailsSchema.omit({ groupId: true }), // groupId optional or from context
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ExpenseWithDetailsResponseSchema,
        },
      },
      description: "Expense created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getExpenseRoute = createRoute({
  method: "get",
  path: "/{expenseId}",
  summary: "Get expense details",
  description:
    "Retrieves the details of a single expense, including how it was split.",
  tags: ["Expenses"],
  request: {
    params: z.object({
      expenseId: z.string().openapi({
        example: "exp_123",
        description: "Expense ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExpenseWithDetailsResponseSchema,
        },
      },
      description: "Expense details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Expense not found" },
  },
});

export const getGroupExpensesRoute = createRoute({
  method: "get",
  path: "/groups/{groupId}",
  summary: "List group expenses",
  description:
    "Lists all expenses associated with a specific group, with support for pagination.",
  tags: ["Expenses"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
    }),
    query: z.object({
      page: z.string().optional().openapi({
        example: "1",
        description: "Page number",
      }),
      limit: z.string().optional().openapi({
        example: "10",
        description: "Items per page",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExpenseListResponseSchema,
        },
      },
      description: "Group expenses retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const updateExpenseRoute = createRoute({
  method: "put",
  path: "/{expenseId}",
  summary: "Update expense",
  description:
    "Updates an existing expense. This action will trigger recalculation of balances.",
  tags: ["Expenses"],
  request: {
    params: z.object({
      expenseId: z.string().openapi({
        example: "exp_123",
        description: "Expense ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: ExpenseUpdateWithDetailsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExpenseWithDetailsResponseSchema,
        },
      },
      description: "Expense updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Expense not found" },
  },
});

export const getExpensesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user expenses",
  description:
    "Lists all expenses the current user is involved in (paginated).",
  tags: ["Expenses"],
  request: {
    query: z.object({
      page: z.string().optional().openapi({
        example: "1",
        description: "Page number",
      }),
      limit: z.string().optional().openapi({
        example: "20",
        description: "Items per page",
      }),
      type: z.string().optional().openapi({
        example: "group",
        description: "Filter by expense type (group, friend, personal)",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              expenses: z.array(ExpenseResponseSchema),
              total: z.number().openapi({ example: 100 }),
              page: z.number().openapi({ example: 1 }),
              limit: z.number().openapi({ example: 20 }),
            })
            .openapi("ExpenseListResponse"),
        },
      },
      description: "Expenses retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getFriendExpensesRoute = createRoute({
  method: "get",
  path: "/friends/{userId}",
  summary: "List friend expenses",
  description:
    "Lists all non-group expenses between the current user and a friend.",
  tags: ["Expenses"],
  request: {
    params: z.object({
      userId: z.string().openapi({
        example: "user_456",
        description: "Friend's user ID",
      }),
    }),
    query: z.object({
      page: z.string().optional().openapi({
        example: "1",
        description: "Page number",
      }),
      limit: z.string().optional().openapi({
        example: "20",
        description: "Items per page",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              expenses: z.array(ExpenseResponseSchema),
              total: z.number().openapi({ example: 25 }),
              page: z.number().openapi({ example: 1 }),
              limit: z.number().openapi({ example: 20 }),
            })
            .openapi("FriendExpenseListResponse"),
        },
      },
      description: "Friend expenses retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Friend not found" },
  },
});

export const deleteExpenseRoute = createRoute({
  method: "delete",
  path: "/{expenseId}",
  summary: "Delete expense",
  description:
    "Deletes an expense, which will also trigger a balance recalculation.",
  tags: ["Expenses"],
  request: {
    params: z.object({
      expenseId: z.string().openapi({
        example: "exp_123",
        description: "Expense ID",
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
              .openapi({ example: "Expense deleted successfully" }),
          }),
        },
      },
      description: "Expense deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Expense not found" },
  },
});

export const createExpenseWithAIRoute = createRoute({
  method: "post",
  path: "/ai",
  summary: "Create expense with AI prompt",
  description:
    "Creates a new expense using natural language input. The AI will parse the prompt to extract expense details, payers, and splits.",
  tags: ["Expenses"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ExpenseCreateWithAIPromptSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ExpenseWithDetailsResponseSchema,
        },
      },
      description: "Expense created successfully via AI",
    },
    400: { description: "Validation Error or AI parsing failed" },
    401: { description: "Unauthorized" },
  },
});

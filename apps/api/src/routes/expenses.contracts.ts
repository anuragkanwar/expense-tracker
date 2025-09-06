import { ExpenseResponseSchema } from "@/models/expense";
import { createRoute, z } from "@hono/zod-openapi";
import {
  ExpenseCreateWithDetailsSchema,
  ExpenseCreateWithAIPromptSchema,
  ExpenseUpdateWithDetailsSchema,
  ExpenseWithDetailsResponseSchema,
  ExpenseListResponseSchema,
} from "@/dto/expenses.dto";

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
      expenseId: z.number().openapi({
        example: 123,
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
      groupId: z.number().openapi({
        example: 123,
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
      expenseId: z.number().openapi({
        example: 123,
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
      userId: z.number().openapi({
        example: 456,
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
      expenseId: z.number().openapi({
        example: 123,
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

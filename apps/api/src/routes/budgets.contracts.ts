import { BudgetResponseSchema, BudgetCreateSchema } from "@/models/budget";
import { createRoute, z } from "@hono/zod-openapi";
import { BudgetWithStatusResponseSchema } from "@/dto/budgets.dto";

export const getBudgetsRoute = createRoute({
  method: "get",
  path: "/budgets",
  summary: "List budgets",
  description: "Lists all of the user's budgets.",
  tags: ["Budgets"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(BudgetWithStatusResponseSchema).openapi({
            description: "List of user's budgets with status",
          }),
        },
      },
      description: "Budgets retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createBudgetRoute = createRoute({
  method: "post",
  path: "/budgets",
  summary: "Create budget",
  description: "Creates a new budget for a specific category.",
  tags: ["Budgets"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: BudgetCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: BudgetResponseSchema,
        },
      },
      description: "Budget created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Category not found" },
  },
});

export const getBudgetRoute = createRoute({
  method: "get",
  path: "/budgets/{budgetId}",
  summary: "Get budget details",
  description: "Retrieves details for a single budget.",
  tags: ["Budgets"],
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
          schema: BudgetWithStatusResponseSchema,
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
  path: "/budgets/{budgetId}",
  summary: "Update budget",
  description: "Updates a budget.",
  tags: ["Budgets"],
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
  path: "/budgets/{budgetId}",
  summary: "Delete budget",
  description: "Deletes a budget.",
  tags: ["Budgets"],
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

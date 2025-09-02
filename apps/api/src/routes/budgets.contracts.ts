import { BudgetResponseSchema, BudgetCreateSchema } from "@/models/budget";
import { RecurringResponseSchema } from "@/models/recurring";
import { createRoute, z } from "@hono/zod-openapi";

// Budget status response schema (extends basic budget with spending info)
export const BudgetWithStatusResponseSchema = BudgetResponseSchema.extend({
  spent: z.number().openapi({
    example: 450.0,
    description: "Amount spent in this budget period",
  }),
  remaining: z.number().openapi({
    example: 50.0,
    description: "Amount remaining in budget",
  }),
  percentage: z.number().openapi({
    example: 90.0,
    description: "Percentage of budget used",
  }),
}).openapi("BudgetWithStatusResponse");

// Goals schema (placeholder - needs model implementation)
export const GoalCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Emergency Fund",
        description: "Goal name",
      }),
    targetAmount: z.number().min(0, "Target must be positive").openapi({
      example: 5000.0,
      description: "Target savings amount",
    }),
    currentAmount: z
      .number()
      .min(0, "Current amount cannot be negative")
      .openapi({
        example: 1200.0,
        description: "Current saved amount",
      }),
    targetDate: z.string().optional().openapi({
      example: "2025-12-31T00:00:00.000Z",
      description: "Target completion date",
    }),
    currency: z
      .string()
      .min(3, "Currency code required")
      .max(3, "Invalid currency code")
      .openapi({
        example: "USD",
        description: "Currency code",
      }),
  })
  .openapi("GoalCreate");

export const GoalResponseSchema = GoalCreateSchema.extend({
  id: z.string().openapi({
    example: "goal_123",
    description: "Unique goal identifier",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID",
  }),
  progress: z.number().openapi({
    example: 24.0,
    description: "Progress percentage",
  }),
  createdAt: z.string().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "When the goal was created",
  }),
  updatedAt: z.string().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "When the goal was updated",
  }),
}).openapi("GoalResponse");

export const createBudgetRoute = createRoute({
  method: "post",
  path: "/budgets",
  summary: "Create budget",
  description: "Creates a new budget for a specific category and time period.",
  tags: ["Budgeting"],
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

export const getBudgetsRoute = createRoute({
  method: "get",
  path: "/budgets",
  summary: "List budgets",
  description:
    "Lists all of the user's budgets and their current status (e.g., amount spent vs. total budget).",
  tags: ["Budgeting"],
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

export const getSubscriptionsRoute = createRoute({
  method: "get",
  path: "/subscriptions",
  summary: "List subscriptions",
  description:
    "Provides a list of all identified recurring payments, helping users manage their subscriptions.",
  tags: ["Budgeting"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(RecurringResponseSchema).openapi({
            description: "List of recurring payments/subscriptions",
          }),
        },
      },
      description: "Subscriptions retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createGoalRoute = createRoute({
  method: "post",
  path: "/goals",
  summary: "Create savings goal",
  description:
    "Creates a new savings goal. Note: Goals model needs to be implemented.",
  tags: ["Budgeting"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoalCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: GoalResponseSchema,
        },
      },
      description: "Goal created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getGoalsRoute = createRoute({
  method: "get",
  path: "/goals",
  summary: "List savings goals",
  description:
    "Lists all savings goals and their current progress. Note: Goals model needs to be implemented.",
  tags: ["Budgeting"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(GoalResponseSchema).openapi({
            description: "List of user's savings goals with progress",
          }),
        },
      },
      description: "Goals retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

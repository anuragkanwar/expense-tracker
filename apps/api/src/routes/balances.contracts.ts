import { createRoute, z } from "@hono/zod-openapi";
import { SettlementCreateSchema } from "@/models/settlement";
import {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  SettlementPlanResponseSchema,
} from "@/dto/balances.dto";

export const getBalanceSummaryRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get balance summary",
  description:
    "Gets the user's total balance (total owed vs. total owed to you).",
  tags: ["Balances"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BalanceSummaryResponseSchema,
        },
      },
      description: "Balance summary retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getFriendBalanceRoute = createRoute({
  method: "get",
  path: "/friends/{userId}",
  summary: "Get friend balance",
  description: "Gets the total consolidated balance with a specific friend.",
  tags: ["Balances"],
  request: {
    params: z.object({
      userId: z.string().openapi({
        example: "user_456",
        description: "Friend's user ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FriendBalanceResponseSchema,
        },
      },
      description: "Friend balance retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Friend not found" },
  },
});

export const getGroupBalanceRoute = createRoute({
  method: "get",
  path: "/groups/{groupId}",
  summary: "Get group balance",
  description: "Gets the user's net balance within a specific group.",
  tags: ["Balances"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GroupBalanceResponseSchema,
        },
      },
      description: "Group balance retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const createSettlementRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Record settlement",
  description: "Records a payment to settle a debt (e.g., 'I paid Jane $20').",
  tags: ["Settlements"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SettlementCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Settlement recorded successfully" }),
          }),
        },
      },
      description: "Settlement recorded successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getGlobalSettlementPlanRoute = createRoute({
  method: "get",
  path: "/simplify",
  summary: "Get global settlement plan",
  description: "Gets a simplified payment plan for all of the user's debts.",
  tags: ["Settlements"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettlementPlanResponseSchema,
        },
      },
      description: "Global settlement plan retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getGroupSettlementPlanRoute = createRoute({
  method: "get",
  path: "/groups/{groupId}/simplify",
  summary: "Get group settlement plan",
  description: "Gets a simplified payment plan for a specific group.",
  tags: ["Settlements"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettlementPlanResponseSchema,
        },
      },
      description: "Group settlement plan retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

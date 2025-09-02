import { createRoute, z } from "@hono/zod-openapi";
import { SettlementCreateSchema } from "@/models/settlement";

// Balance summary response schema
export const BalanceSummaryResponseSchema = z
  .object({
    totalOwed: z.number().openapi({
      example: 150.0,
      description: "Total amount others owe you",
    }),
    totalOwe: z.number().openapi({
      example: 75.5,
      description: "Total amount you owe others",
    }),
    netBalance: z.number().openapi({
      example: 74.5,
      description:
        "Net balance (positive = you're owed money, negative = you owe money)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Primary currency",
    }),
  })
  .openapi("BalanceSummaryResponse");

// Friend balance response schema
export const FriendBalanceResponseSchema = z
  .object({
    friendId: z.string().openapi({
      example: "user_456",
      description: "Friend's user ID",
    }),
    friendName: z.string().openapi({
      example: "Jane Doe",
      description: "Friend's name",
    }),
    balance: z.number().openapi({
      example: 25.5,
      description:
        "Balance with this friend (positive = they owe you, negative = you owe them)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Balance currency",
    }),
    lastActivity: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Last activity date",
    }),
  })
  .openapi("FriendBalanceResponse");

// Group balance response schema
export const GroupBalanceResponseSchema = z
  .object({
    groupId: z.string().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    groupName: z.string().openapi({
      example: "Trip to Paris",
      description: "Group name",
    }),
    balance: z.number().openapi({
      example: -15.25,
      description:
        "Your balance in this group (positive = you're owed, negative = you owe)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Balance currency",
    }),
    memberCount: z.number().openapi({
      example: 4,
      description: "Number of group members",
    }),
  })
  .openapi("GroupBalanceResponse");

// Settlement plan response schema
export const SettlementPlanResponseSchema = z
  .array(
    z.object({
      fromUserId: z.string().openapi({
        example: "user_123",
        description: "User who should pay",
      }),
      fromUserName: z.string().openapi({
        example: "John Doe",
        description: "Name of user who should pay",
      }),
      toUserId: z.string().openapi({
        example: "user_456",
        description: "User who should receive payment",
      }),
      toUserName: z.string().openapi({
        example: "Jane Smith",
        description: "Name of user who should receive payment",
      }),
      amount: z.number().openapi({
        example: 25.5,
        description: "Amount to transfer",
      }),
      currency: z.string().openapi({
        example: "USD",
        description: "Transfer currency",
      }),
    })
  )
  .openapi("SettlementPlanResponse");

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

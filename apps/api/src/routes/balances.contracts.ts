import { createRoute, z } from "@hono/zod-openapi";
import {
  IdParamSchema,
  UserIdParamSchema,
  MessageResponseSchema, // kept for potential future reuse
} from "./shared-schemas";
import {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  BalancesSettlementPlanResponseSchema,
  DirectSettlementRequestSchema,
  DirectSettlementResponseSchema,
} from "@pocket-pixie/contracts";

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
      userId: UserIdParamSchema.openapi({ description: "Friend's user ID" }),
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
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

export const createDirectSettlementRoute = createRoute({
  // Idempotency-Key header required
  // Direct settlement returns full SettlementResponse

  method: "post",
  path: "/",
  summary: "Record settlement",
  description: "Records a payment to settle a debt (e.g., 'I paid Jane $20').",
  tags: ["Settlements"],
  request: {
    headers: z
      .object({
        "Idempotency-Key": z.string().min(1).openapi({
          description:
            "Idempotency key to safely retry settlement creation requests without creating duplicates",
          example: "settle-123e4567-e89b-12d3-a456-426614174000",
        }),
      })
      .openapi({ description: "Required idempotency header" }),
    body: {
      content: {
        "application/json": {
          schema: DirectSettlementRequestSchema, // Direct payer/payee settlement requires Idempotency-Key header
        },
      },
    },
  },
  responses: {
    201: {
      // 201 indicates newly created direct settlement (not a replay)

      content: {
        "application/json": {
          // Return full settlement details
          schema: DirectSettlementResponseSchema,
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
          schema: BalancesSettlementPlanResponseSchema,
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BalancesSettlementPlanResponseSchema,
        },
      },
      description: "Group settlement plan retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

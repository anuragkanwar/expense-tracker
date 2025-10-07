import { createRoute, z } from "@hono/zod-openapi";
import { IdParamSchema, UserIdParamSchema } from "./shared-schemas";
import {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  BalancesSettlementPlanResponseSchema,
} from "@pocket-pixie/contracts";

// [REMOVED] createDirectSettlementRoute: Legacy direct settlement endpoint removed as part of migration to allocation-based settlement.

export const getBalanceSummaryRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get balance summary",
  description:
    "Gets the user's total balance (total owed vs. total owed to you). " +
    "Based on the user_balance system where positive amounts mean counterParty owes owner, " +
    "and negative amounts mean owner owes counterParty. These balances are materialized in real-time " +
    "for loans, shared expenses, allocations, and settlements.",
  tags: ["Balances"],
  operationId: "getBalanceSummary",
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
  description:
    "Gets the total consolidated balance with a specific friend. " +
    "This represents the net position between two users across all non-group contexts. " +
    "Based on the materialized user_balance table where positive values indicate the friend owes you, " +
    "and negative values indicate you owe the friend.",
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
  description:
    "Gets the user's net balance within a specific group. " +
    "Retrieves group-scoped balances from the user_balance table where groupId matches. " +
    "Balances follow the sign convention: positive means other group members owe you, " +
    "negative means you owe other group members. This is a materialized view that's " +
    "updated in real time through loans, expense shares, and settlements.",
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

/* Direct settlement route removed as part of legacy flow cleanup */
// // [REMOVED] createDirectSettlementRoute: Legacy direct settlement endpoint removed as part of migration to allocation-based settlement.

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

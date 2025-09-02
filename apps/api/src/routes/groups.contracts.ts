import {
  GroupResponseSchema,
  GroupCreateSchema,
  GroupUpdateSchema,
} from "@/models/group";
import { GroupMemberCreateSchema } from "@/models/group-member";
import { SettlementCreateSchema } from "@/models/settlement";
import { UserBalanceResponseSchema } from "@/models/user-balance";
import { createRoute, z } from "@hono/zod-openapi";

// Group balances response schema
export const GroupBalancesResponseSchema = z
  .array(
    z.object({
      userId: z.string().openapi({
        example: "user_123",
        description: "User ID",
      }),
      name: z.string().openapi({
        example: "John Doe",
        description: "User name",
      }),
      balance: z.number().openapi({
        example: 25.5,
        description:
          "Net balance (positive = owed to user, negative = owes to others)",
      }),
      currency: z.string().openapi({
        example: "USD",
        description: "Balance currency",
      }),
    })
  )
  .openapi("GroupBalancesResponse");

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

export const createGroupRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new group",
  description: "Creates a new expense-sharing group.",
  tags: ["Groups"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: GroupCreateSchema.omit({ createdBy: true }), // createdBy will be set from auth
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: GroupResponseSchema,
        },
      },
      description: "Group created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getGroupsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List user's groups",
  description: "Lists all groups that the current user is a member of.",
  tags: ["Groups"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(GroupResponseSchema).openapi({
            description: "List of user's groups",
          }),
        },
      },
      description: "Groups retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const getGroupRoute = createRoute({
  method: "get",
  path: "/{groupId}",
  summary: "Get group details",
  description: "Retrieves detailed information about a specific group.",
  tags: ["Groups"],
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
          schema: GroupResponseSchema,
        },
      },
      description: "Group details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const updateGroupRoute = createRoute({
  method: "put",
  path: "/{groupId}",
  summary: "Update group",
  description:
    "Updates the details of a specific group (e.g., name, cover photo).",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: GroupUpdateSchema.omit({ createdBy: true }), // createdBy shouldn't be updated
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GroupResponseSchema,
        },
      },
      description: "Group updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const addGroupMemberRoute = createRoute({
  method: "post",
  path: "/{groupId}/members",
  summary: "Add group member",
  description: "Adds a new member to a group.",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: GroupMemberCreateSchema.omit({ groupId: true }), // groupId from path
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
              .openapi({ example: "Member added successfully" }),
          }),
        },
      },
      description: "Member added successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
    409: { description: "User already a member" },
  },
});

export const removeGroupMemberRoute = createRoute({
  method: "delete",
  path: "/{groupId}/members/{userId}",
  summary: "Remove group member",
  description: "Removes a member from a group.",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: z.string().openapi({
        example: "grp_123",
        description: "Group ID",
      }),
      userId: z.string().openapi({
        example: "user_456",
        description: "User ID to remove",
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
              .openapi({ example: "Member removed successfully" }),
          }),
        },
      },
      description: "Member removed successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group or member not found" },
  },
});

export const getGroupBalancesRoute = createRoute({
  method: "get",
  path: "/{groupId}/balances",
  summary: "Get group balances",
  description:
    "Retrieves the current net balances for all members in a specified group.",
  tags: ["Groups"],
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
          schema: GroupBalancesResponseSchema,
        },
      },
      description: "Group balances retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const getSettlementPlanRoute = createRoute({
  method: "get",
  path: "/{groupId}/settlement-plan",
  summary: "Get settlement plan",
  description:
    "Returns the simplified list of transactions required to settle all debts in the group.",
  tags: ["Groups"],
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
      description: "Settlement plan retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const createSettlementRoute = createRoute({
  method: "post",
  path: "/settlements",
  summary: "Record settlement",
  description:
    "Records that a payment has been made to settle a debt. This action triggers balance updates and settlement events.",
  tags: ["Groups"],
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

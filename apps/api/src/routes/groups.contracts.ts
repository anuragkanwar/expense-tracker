import { createRoute, z } from "@hono/zod-openapi";
import {
  IdParamSchema,
  UserIdParamSchema,
  MessageResponseSchema,
  StandardErrorSchema,
  IdempotencyConflictErrorSchema,
} from "./shared-schemas";
import {
  GroupResponseSchema,
  GroupCreateSchema,
  GroupUpdateSchema,
  GroupMemberCreateSchema,
  GroupMemberBulkCreateSchema,
  GroupMemberBulkResponseSchema,
  DirectSettlementRequestSchema,
  DirectSettlementResponseSchema,
  GroupBalancesResponseSchema,
  SettlementPlanResponseSchema,
} from "@pocket-pixie/contracts";

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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
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
  summary: "Add group member(s)",
  description:
    "Adds one or more members to a group. Supports both single member and bulk addition.",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.union([
            GroupMemberCreateSchema.omit({ groupId: true }), // Single member
            GroupMemberBulkCreateSchema, // Bulk members
          ]),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.union([
            z.object({
              message: z
                .string()
                .openapi({ example: "Member added successfully" }),
            }),
            GroupMemberBulkResponseSchema,
          ]),
        },
      },
      description: "Member(s) added successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
      userId: UserIdParamSchema.openapi({ description: "User ID to remove" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema.openapi({
            example: { message: "Member removed successfully" },
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
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
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
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

export const deleteGroupRoute = createRoute({
  method: "delete",
  path: "/{groupId}",
  summary: "Delete group",
  description: "Deletes a group. Only the group creator can delete the group.",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: IdParamSchema.openapi({ description: "Group ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Group deleted successfully" }),
          }),
        },
      },
      description: "Group deleted successfully",
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Only group creator can delete" },
    404: { description: "Group not found" },
  },
});

export const getGroupMembersRoute = createRoute({
  method: "get",
  path: "/{groupId}/members",
  summary: "List group members",
  description: "Lists all members of a specific group.",
  tags: ["Groups"],
  request: {
    params: z.object({
      groupId: z.coerce.number().int().positive().openapi({
        example: "123",
        description: "Group ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                userId: z.number().openapi({ example: 123 }),
                name: z.string().openapi({ example: "John Doe" }),
                email: z
                  .string()
                  .email()
                  .openapi({ example: "john@example.com" }),
                joinedAt: z
                  .string()
                  .openapi({ example: "2025-09-01T12:00:00.000Z" }),
              })
            )
            .openapi({
              description: "List of group members",
            }),
        },
      },
      description: "Group members retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Group not found" },
  },
});

export const createGroupDirectSettlementRoute = createRoute({
  method: "post",
  path: "/settlements",
  summary: "Record settlement",
  description:
    "Records that a payment has been made to settle a debt. This action triggers balance updates and settlement events.",
  tags: ["Groups"],
  request: {
    headers: z
      .object({
        "Idempotency-Key": z.string().min(1).openapi({
          description:
            "Idempotency key to safely retry settlement creation requests without creating duplicates",
          example: "group-settle-123e4567-e89b-12d3-a456-426614174000",
        }),
      })
      .openapi({ description: "Required idempotency header" }),
    body: {
      content: {
        "application/json": {
          schema: DirectSettlementRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: DirectSettlementResponseSchema,
        },
      },
      description: "Settlement recorded successfully (new)",
    },
    200: {
      content: {
        "application/json": {
          schema: DirectSettlementResponseSchema,
        },
      },
      description: "Idempotent replay - original settlement returned",
    },
    400: {
      description: "Validation Error or Idempotency-Key required",
      content: { "application/json": { schema: StandardErrorSchema } },
    },
    409: {
      description: "Idempotency-Key conflict (payload mismatch on reuse)",
      content: {
        "application/json": { schema: IdempotencyConflictErrorSchema },
      },
    },
    401: { description: "Unauthorized" },
  },
});

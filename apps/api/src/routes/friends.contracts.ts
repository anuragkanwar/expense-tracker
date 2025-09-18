import {
  FriendshipResponseSchema,
  UserResponseSchema,
  LoanResponseSchema,
} from "@pocket-pixie/contracts";

import { createRoute, z } from "@hono/zod-openapi";
import { IdParamSchema } from "./shared-schemas";

export const getFriendsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get user's friends",
  description: "Returns a list of the user's friends.",
  tags: ["Friends"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UserResponseSchema).openapi({
            description: "List of friends",
          }),
        },
      },
      description: "Friends list retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const sendFriendRequestRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Send friend request",
  description: "Sends a friend request to another user.",
  tags: ["Friends"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            friendId: z.number().openapi({
              example: 456,
              description: "ID of the user to send friend request to",
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FriendshipResponseSchema,
        },
      },
      description: "Friend request sent successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    409: { description: "Friend request already exists" },
  },
});

export const respondToFriendRequestRoute = createRoute({
  method: "put",
  path: "/requests/{userId}",
  summary: "Accept or reject friend request",
  description:
    "Accepts or rejects a pending friend request from a specific user.",
  tags: ["Friends"],
  request: {
    params: z.object({
      userId: z.coerce.number().int().positive().openapi({
        example: 456,
        description: "ID of the user who sent the request",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            action: z.enum(["accept", "reject"]).openapi({
              example: "accept",
              description: "Action to take on the friend request",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Friend request accepted" }),
          }),
        },
      },
      description: "Friend request updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Friend request not found" },
  },
});

export const getFriendRequestsRoute = createRoute({
  method: "get",
  path: "/requests",
  summary: "List friend requests",
  description: "Lists all pending friend requests for the current user.",
  tags: ["Friends"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .array(
              z.object({
                id: z.number().openapi({ example: 123 }),
                fromUserId: z.number().openapi({ example: 456 }),
                fromUserName: z.string().openapi({ example: "Jane Doe" }),
                fromUserEmail: z
                  .string()
                  .openapi({ example: "jane@example.com" }),
                status: z.string().openapi({ example: "pending" }),
                createdAt: z
                  .string()
                  .openapi({ example: "2025-09-01T12:00:00.000Z" }),
              })
            )
            .openapi({
              description: "List of pending friend requests",
            }),
        },
      },
      description: "Friend requests retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const removeFriendRoute = createRoute({
  method: "delete",
  path: "/{userId}",
  summary: "Remove friend",
  description: "Removes a friend or cancels a friend request.",
  tags: ["Friends"],
  request: {
    params: z.object({
      userId: z.number().openapi({
        example: 456,
        description: "ID of the friend to remove",
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
              .openapi({ example: "Friend removed successfully" }),
          }),
        },
      },
      description: "Friend removed successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Friend not found" },
  },
});

export const unblockUserRoute = createRoute({
  method: "delete",
  path: "/{userId}/block",
  summary: "Unblock user",
  description: "Unblocks a previously blocked user.",
  tags: ["Friends"],
  request: {
    params: z.object({
      userId: z.number().openapi({
        example: 456,
        description: "ID of the user to unblock",
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
              .openapi({ example: "User unblocked successfully" }),
          }),
        },
      },
      description: "User unblocked successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "User not found" },
  },
});

// Friend Loans Query Schema
export const FriendLoanListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().optional().openapi({ example: 20 }),
});

export type FriendLoanListQuery = z.infer<typeof FriendLoanListQuerySchema>;

// Friend Loans API Contract
export const getFriendLoansRoute = createRoute({
  method: "get",
  path: "/{friendId}/loans",
  summary: "List loans between friends",
  description:
    "Lists loans between the authenticated user and a specific friend. Requires active friendship. " +
    "Returns loans where either the authenticated user is the creditor and the friend is the debtor, " +
    "or where the friend is the creditor and the authenticated user is the debtor. " +
    "This endpoint provides a consolidated view of the bilateral loan relationship between two friends, " +
    "showing both money lent and borrowed. Results are paginated and sorted by creation date (most recent first).",
  tags: ["Friends", "Loans"],
  request: {
    params: z.object({
      friendId: IdParamSchema.openapi({ description: "Friend ID" }),
    }),
    query: FriendLoanListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              loans: z.array(LoanResponseSchema),
              total: z.number(),
              page: z.number(),
              limit: z.number(),
            })
            .openapi("FriendLoanListResponse"),
          examples: {
            "friend-loans": {
              value: {
                loans: [
                  {
                    id: 101,
                    amount: 50,
                    currency: "USD",
                    description: "Dinner",
                    creditorId: 100,
                    debtorId: 200,
                    transactionId: 401,
                    createdAt: "2025-09-16T12:00:00Z",
                  },
                  {
                    id: 102,
                    amount: 75.5,
                    currency: "USD",
                    description: "Movie tickets",
                    creditorId: 200,
                    debtorId: 100,
                    transactionId: 402,
                    createdAt: "2025-09-17T15:30:00Z",
                  },
                ],
                total: 2,
                page: 1,
                limit: 20,
              },
            },
          },
        },
      },
      description: "Friend loans retrieved successfully",
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
          examples: {
            "not-friends": {
              value: {
                success: false,
                error: {
                  code: "INVALID_RELATIONSHIP",
                  message: "You can only view expenses with friends",
                },
              },
            },
            "invalid-params": {
              value: {
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Invalid pagination parameters",
                },
              },
            },
            "self-reference": {
              value: {
                success: false,
                error: {
                  code: "INVALID_INPUT",
                  message: "Cannot view loans with yourself",
                },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
    403: {
      description: "Not friends with user",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
});

import {
  FriendshipResponseSchema,
  FriendshipCreateSchema,
  FriendshipUpdateSchema,
} from "@/models/friendship";
import { UserResponseSchema } from "@/models/user";
import { createRoute, z } from "@hono/zod-openapi";

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
            friendId: z.string().openapi({
              example: "user_456",
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
      userId: z.string().openapi({
        example: "user_456",
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
                id: z.string().openapi({ example: "frd_123" }),
                fromUserId: z.string().openapi({ example: "user_456" }),
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

export const updateFriendRequestRoute = createRoute({
  method: "put",
  path: "/requests/{userId}",
  summary: "Accept or reject friend request",
  description:
    "Accepts or rejects a pending friend request from a specific user.",
  tags: ["Friends"],
  request: {
    params: z.object({
      userId: z.string().openapi({
        example: "user_456",
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

export const removeFriendRoute = createRoute({
  method: "delete",
  path: "/{userId}",
  summary: "Remove friend",
  description: "Removes a friend or cancels a friend request.",
  tags: ["Friends"],
  request: {
    params: z.object({
      userId: z.string().openapi({
        example: "user_456",
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

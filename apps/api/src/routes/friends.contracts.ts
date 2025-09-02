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

export const updateFriendRequestRoute = createRoute({
  method: "put",
  path: "/{friendshipId}",
  summary: "Accept or reject friend request",
  description: "Accepts or rejects a pending friend request.",
  tags: ["Friends"],
  request: {
    params: z.object({
      friendshipId: z.string().openapi({
        example: "frd_123",
        description: "Friendship ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["accepted", "rejected"]).openapi({
              example: "accepted",
              description: "New status for the friend request",
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
          schema: FriendshipResponseSchema,
        },
      },
      description: "Friend request updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Friendship not found" },
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

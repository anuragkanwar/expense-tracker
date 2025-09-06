import { UserResponseSchema, UserUpdateSchema } from "@/models/user";
import { createRoute } from "@hono/zod-openapi";

export const getCurrentUserRoute = createRoute({
  method: "get",
  path: "/me",
  summary: "Get current user profile",
  description: "Retrieves the profile of the currently authenticated user.",
  tags: ["Users"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
      description: "User profile retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const updateCurrentUserRoute = createRoute({
  method: "put",
  path: "/me",
  summary: "Update current user profile",
  description: "Updates the profile of the currently authenticated user.",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserResponseSchema,
        },
      },
      description: "User profile updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

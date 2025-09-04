import { SignUpSchema, AuthResponseSchema, SignInSchema } from "@/models/user";
import { createRoute, z } from "@hono/zod-openapi";

export const registerRoute = createRoute({
  method: "post",
  path: "/register",
  summary: "Register a new user",
  description: "Creates a new user account with the provided information.",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignUpSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
      description: "User created successfully",
    },
    400: { description: "Validation Error" },
    409: { description: "Conflict (e.g., email already exists)" },
  },
});

export const loginRoute = createRoute({
  method: "post",
  path: "/login",
  summary: "Authenticate user",
  description: "Authenticates a user with credentials and returns a JWT token.",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignInSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
      description: "Authentication successful",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const logoutRoute = createRoute({
  method: "post",
  path: "/logout",
  summary: "Logout user",
  description: "Logs out the currently authenticated user.",
  tags: ["Authentication"],
  responses: {
    200: {
      description: "Successfully logged out",
      content: {
        "application/json": {
          schema: z.object({
            success: z.string().openapi({ example: "Logged out successfully" }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

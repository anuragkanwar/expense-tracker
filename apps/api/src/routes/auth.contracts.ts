import { SignUpSchema, AuthResponseSchema, SignInScheme } from "@/models/auth";
import { createRoute, z } from "@hono/zod-openapi";

export const signUpRoute = createRoute({
  method: "post",
  path: "/signup",
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
      description: "Student created successfully",
    },
    400: { description: "Validation Error" },
    409: { description: "Conflict (e.g., email already exists)" },
  },
});


export const signInRoute = createRoute({
  method: "post",
  path: "/signin",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignInScheme,
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
      description: "Signed in successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});



export const signOutRoute = createRoute({
  method: "post",
  path: "/signout",
  responses: {
    200: {
      description: "Successfully signed out",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

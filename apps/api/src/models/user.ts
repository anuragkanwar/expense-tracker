import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { user } from "@pocket-pixie/db";

// ==========================================================
// USER SCHEMAS
// ==========================================================

export const UserResponseSchema = createSelectSchema(user, {
  id: z.number().openapi({
    example: 1234,
    description: "User's Id",
  }),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
  email: z.email("Invalid email format").openapi({
    example: "john.doe@example.com",
    description: "Student's email address",
  }),
  emailVerified: z.boolean().openapi({
    example: "true",
    description: "Is user have a verified email id",
  }),
  image: z.string().openapi({
    example: "https://exmaple-image",
    description: "user image url",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "EUR",
      description: "Currency code",
    }),
  createdAt: z.string().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "When the user was created",
  }),
  updatedAt: z.string().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "When the user was updated",
  }),
}).openapi("UserResponse");

export const UserCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "John Doe",
        description: "User's full name",
      }),
    email: z.email("Invalid email format").openapi({
      example: "john.doe@example.com",
      description: "User's email address",
    }),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .max(150, "Password too long")
      .openapi({
        example: "password1234",
        description: "Password",
      }),
  })
  .openapi("UserCreate");

export const SignUpSchema = UserCreateSchema;

export const SignInSchema = z
  .object({
    email: z.email("Invalid email format").openapi({
      example: "john.doe@example.com",
      description: "User's email address",
    }),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .max(150, "Password too long")
      .openapi({
        example: "password1234",
        description: "Password",
      }),
  })
  .openapi("SignIn");

export const UserUpdateSchema =
  UserCreateSchema.partial().openapi("UserUpdate");

export const AuthResponseSchema = z
  .object({
    user: UserResponseSchema.pick({ id: true, name: true, email: true }),
    session: z.object({
      token: z.string().openapi({ example: "jwt_token_here" }),
    }),
  })
  .openapi("AuthResponse");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

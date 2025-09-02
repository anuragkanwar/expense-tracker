import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { user, session, verification, account } from "@pocket-pixie/db";

export const userResponseSchema = createSelectSchema(user, {
  id: z
    .string()
    .openapi({
      example: "user_1234",
      description: "User's Id"
    }),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
  email: z
    .email("Invalid email format")
    .openapi({
      example: "john.doe@example.com",
      description: "Student's email address",
    }),
  emailVerified: z
    .boolean()
    .openapi({
      example: "true",
      description: "Is user have a verified email id",
    }),
  image: z
    .string()
    .openapi({
      example: "https://exmaple-image",
      description: "user image url"
    }),
  createdAt: z
    .string()
    .openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the user was created",
    }),
  updatedAt: z
    .string()
    .openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the user was updated",
    }),
})

export const SignUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "John Doe",
      description: "Student's full name",
    }),
  email: z
    .email("Invalid email format")
    .openapi({
      example: "john.doe@example.com",
      description: "Student's email address",
    }),
  password: z
    .string()
    .min(8, "Min 8 charachters")
    .max(150, "Password too long")
    .openapi({
      example: "password1234",
      description: "Password"
    })
})


export const SignInScheme = z.object({
  email: z
    .email("Invalid email format")
    .openapi({
      example: "john.doe@example.com",
      description: "Student's email address",
    }),
  password: z
    .string()
    .min(8, "Min 8 charachters")
    .max(150, "Password too long")
    .openapi({
      example: "password1234",
      description: "Password"
    })
})



export type UserResponse = z.infer<typeof userResponseSchema>
export type SignUp = z.infer<typeof SignUpSchema>
export type SignIn = z.infer<typeof SignInScheme>


const sessionResponseSchema = createSelectSchema(session);
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

const accountResponseSchema = createSelectSchema(account);
export type AccountResponse = z.infer<typeof accountResponseSchema>

const verificationResponseSchema = createSelectSchema(verification);
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;

export const AuthResponseSchema = z.object({
  user: userResponseSchema.pick({ id: true, name: true, email: true }),
  session: z.object({
    token: z.string(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

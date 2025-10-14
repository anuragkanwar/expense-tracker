import { z } from "zod";

// Login credentials schema
export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Signup credentials schema
export const SignupCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1),
});

export type SignupCredentials = z.infer<typeof SignupCredentialsSchema>;

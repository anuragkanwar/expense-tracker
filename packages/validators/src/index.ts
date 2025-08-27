
import { z } from "zod";

export const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const UserSchema = z.object({
  email: z.email(),
});

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { z } from "@hono/zod-openapi";
import {
  UserCreateSchema,
  SignInSchema,
  AuthResponseSchema,
} from "@pocket-pixie/contracts";

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

const BASE = "/api/v1/auth";

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: UserCreateInput) => {
      const res = await apiClient.post(`${BASE}/sign-up/email`, input);
      return AuthResponseSchema.parse(res.data);
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const res = await apiClient.post(`${BASE}/sign-in/email`, input);
      return AuthResponseSchema.parse(res.data);
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`${BASE}/sign-out`);
      return res.data as { success: string };
    },
  });
}

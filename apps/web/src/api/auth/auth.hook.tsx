import type {
  LoginCredentials,
  SignupCredentials,
  UserAuth,
} from "@pocket-pixie/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { CURRENT_USER_QK } from "./queryKeys";

export function useUser() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  return {
    data: session?.user as unknown as UserAuth | undefined,
    isPending,
    error,
    refetch,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await authClient.signIn.email(credentials);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QK });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const res = await authClient.signUp.email(credentials);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QK });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      const res = await authClient.signOut();
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QK, null);
      queryClient.removeQueries({ queryKey: CURRENT_USER_QK });
      navigate({ to: "/auth/signin" });
    },
  });
}

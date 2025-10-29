import type {
	LoginCredentials,
	SignupCredentials,
	UserAuth,
} from "@pocket-pixie/contracts";
import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { CURRENT_USER_QK } from "./queryKeys";

export const userQueryOptions = queryOptions({
	queryKey: CURRENT_USER_QK,
	queryFn: async () => {
		const { data: session, error } = await authClient.getSession();
		if (error) {
			console.warn("Session fetch error:", error.message);
			throw error;
		}

		return {
			...session?.user,
			id: parseInt(session?.user.id || "-1", 10),
		} as UserAuth;
	},
	staleTime: 5 * 60 * 1000, // 5 minutes
	retry: false, // Optional: good for auth checks
});

export function useUser() {
	const { data, isLoading, error, refetch } =
		useSuspenseQuery(userQueryOptions);
	return {
		data,
		isPending: isLoading,
		error,
		refetch,
	};
}

export function useLogin() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (credentials: LoginCredentials) => {
			const { data, error } = await authClient.signIn.email(credentials);
			if (error) {
				throw new Error(error.message || "Login failed");
			}
			return data;
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
			if (res.error) throw new Error(res.error.message || "Signup failed");
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
			if (res.error) throw new Error(res.error.message || "Logout failed");
			return res.data;
		},
		onSuccess: () => {
			queryClient.setQueryData(CURRENT_USER_QK, null);
			queryClient.removeQueries({ queryKey: CURRENT_USER_QK });
			navigate({ to: "/auth/signin" });
		},
	});
}

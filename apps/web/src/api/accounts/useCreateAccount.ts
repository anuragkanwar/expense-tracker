import type {
	TransactionAccountCreate,
	TransactionAccountResponse,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useCreateAccount() {
	return useMutation<
		TransactionAccountResponse,
		unknown,
		TransactionAccountCreate,
		unknown
	>({
		mutationKey: accountsKeys.all,
		mutationFn: async (data: TransactionAccountCreate) => {
			const resp = await api.post<TransactionAccountResponse>(
				"/accounts",
				data,
			);
			return resp.data;
		},
	});
}

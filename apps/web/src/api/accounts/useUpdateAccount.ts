import type {
	TransactionAccountResponse,
	TransactionAccountUpdate,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useUpdateAccount() {
	return useMutation<
		TransactionAccountResponse,
		unknown,
		{ accountId: number; data: TransactionAccountUpdate },
		unknown
	>({
		mutationKey: accountsKeys.all,
		mutationFn: async ({
			accountId,
			data,
		}: {
			accountId: number;
			data: TransactionAccountUpdate;
		}) => {
			const resp = await api.put<TransactionAccountResponse>(
				`/accounts/${accountId}`,
				data,
			);
			return resp.data;
		},
	});
}

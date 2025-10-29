import type {
	TransactionCreateWithDetails,
	TransactionWithDetailsResponse,
} from "@pocket-pixie/contracts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { transactionsKeys } from "./queryKeys";

export function useCreateTransaction() {
	return useMutation<
		TransactionWithDetailsResponse,
		unknown,
		TransactionCreateWithDetails,
		unknown
	>({
		mutationKey: transactionsKeys.all,
		mutationFn: async (data: TransactionCreateWithDetails) => {
			console.log(data);
			const resp = await api.post<TransactionWithDetailsResponse>(
				"/transactions",
				data,
			);
			return resp.data;
		},
	});
}

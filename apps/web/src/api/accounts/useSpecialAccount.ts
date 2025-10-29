import type { TransactionAccountResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { accountsKeys } from "./queryKeys";

export function useSpecialAccount(type: string) {
	return useSuspenseQuery({
		queryKey: accountsKeys.specialByType(type),
		queryFn: async () => {
			const resp = await api.get<TransactionAccountResponse | null>(
				`/accounts/special/${type}`,
			);
			return resp.data;
		},
		staleTime: Infinity,
	});
}

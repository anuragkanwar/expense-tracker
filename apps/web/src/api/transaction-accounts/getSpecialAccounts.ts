import type { TransactionAccountResponse } from "@pocket-pixie/contracts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  ACCOUNT_TYPE_EXTERNAL,
  ACCOUNT_TYPE_INCOME,
  ACCOUNT_TYPE_LOAN_GIVEN,
  ACCOUNT_TYPE_LOAN_TAKEN,
  ACCOUNT_TYPE_OUTGOING,
  ACCOUNT_TYPE_SAVING,
  ALL_ACCOUNTS,
} from "./queryKeys";

export const useAccountTypeExternal = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_EXTERNAL,
    queryFn: async () => {
      return await api.get("/accounts/special/EXTERNAL");
    },
    staleTime: Infinity,
  });
};

export const useAccountTypeIncome = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_INCOME,
    queryFn: async () => {
      return await api.get("/accounts/special/INTERNAL");
    },
    staleTime: Infinity,
  });
};

export const useAccountTypeSaving = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_SAVING,
    queryFn: async () => {
      return await api.get("/accounts/special/SAVING");
    },
    staleTime: Infinity,
  });
};

export const useAccountTypeLoanGiven = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_LOAN_GIVEN,
    queryFn: async () => {
      return await api.get("/accounts/special/LOAN_GIVEN");
    },
    staleTime: Infinity,
  });
};

export const useAccountTypeLoanTaken = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_LOAN_TAKEN,
    queryFn: async () => {
      return await api.get<TransactionAccountResponse>(
        "/accounts/special/LOAN_TAKEN",
      );
    },
    staleTime: Infinity,
  });
};

export const useAccountTypeOutgoing = () => {
  return useSuspenseQuery({
    queryKey: ACCOUNT_TYPE_OUTGOING,
    queryFn: async () => {
      return await api.get<TransactionAccountResponse>(
        "/accounts/special/OUTGOING",
      );
    },
    staleTime: Infinity,
  });
};

export const usegetAllAccounts = () => {
  return useSuspenseQuery({
    queryKey: ALL_ACCOUNTS,
    queryFn: async () => {
      return await api.get<TransactionAccountResponse[]>("/accounts");
    },
    staleTime: Infinity,
  });
};

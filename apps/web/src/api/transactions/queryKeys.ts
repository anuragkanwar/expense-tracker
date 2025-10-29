export const transactionsKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...transactionsKeys.lists(), filters] as const,
  details: () => [...transactionsKeys.all, "detail"] as const,
  detail: (id: number) => [...transactionsKeys.details(), id] as const,
  groups: () => [...transactionsKeys.all, "groups"] as const,
  groupTransactions: (groupId: number) =>
    [...transactionsKeys.groups(), groupId] as const,
  friends: () => [...transactionsKeys.all, "friends"] as const,
  friendTransactions: (userId: number) =>
    [...transactionsKeys.friends(), userId] as const,
};

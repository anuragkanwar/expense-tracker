// Centralized React Query keys for consistency & cache scoping
// Keys are arrays to allow hierarchical invalidation (e.g., invalidateQueries({ queryKey: queryKeys.groups._def }))

export const queryKeys = {
  groups: {
    root: () => ["groups"] as const,
    list: () => ["groups", "list"] as const,
    detail: (groupId: number | string) =>
      ["groups", "detail", groupId] as const,
    members: (groupId: number | string) =>
      ["groups", "members", groupId] as const,
    balances: (groupId: number | string) =>
      ["groups", "balances", groupId] as const,
    settlementPlan: (groupId: number | string) =>
      ["groups", "settlement-plan", groupId] as const,
  },
  balances: {
    summary: () => ["balances", "summary"] as const,
    friend: (userId: number | string) =>
      ["balances", "friend", userId] as const,
    group: (groupId: number | string) =>
      ["balances", "group", groupId] as const,
    simplify: () => ["balances", "simplify"] as const,
    groupSimplify: (groupId: number | string) =>
      ["balances", "group", groupId, "simplify"] as const,
  },
  budgets: {
    list: () => ["budgets", "list"] as const,
    detail: (budgetId: number | string) =>
      ["budgets", "detail", budgetId] as const,
  },
  categories: {
    list: () => ["categories", "list"] as const,
    detail: (categoryId: number | string) =>
      ["categories", "detail", categoryId] as const,
  },
  friends: {
    list: () => ["friends", "list"] as const,
    requests: () => ["friends", "requests"] as const,
    detail: (userId: number | string) => ["friends", "detail", userId] as const,
  },
  transactions: {
    list: (filters?: { page?: number; limit?: number; type?: string }) =>
      ["transactions", "list", filters ?? {}] as const,
    detail: (transactionId: number | string) =>
      ["transactions", "detail", transactionId] as const,
    group: (groupId: number | string, page?: number, limit?: number) =>
      ["transactions", "group", { groupId, page, limit }] as const,
    friend: (userId: number | string, page?: number, limit?: number) =>
      ["transactions", "friend", { userId, page, limit }] as const,
  },
  connections: {
    list: () => ["connections", "list"] as const,
    detail: (id: number | string) => ["connections", "detail", id] as const,
  },
  dashboard: {
    summary: () => ["dashboard", "summary"] as const,
  },
  passbook: {
    list: (filters?: { page?: number; limit?: number; accountId?: number }) =>
      ["passbook", "list", filters ?? {}] as const,
  },
  recurringItems: {
    list: () => ["recurring-items", "list"] as const,
    detail: (id: number | string) => ["recurring-items", "detail", id] as const,
  },
  accounts: {
    me: () => ["accounts", "me"] as const,
    list: () => ["accounts", "list"] as const,
    detail: (id: number | string) => ["accounts", "detail", id] as const,
  },
  transactionAccounts: {
    list: () => ["transaction-accounts", "list"] as const,
    detail: (id: number | string) =>
      ["transaction-accounts", "detail", id] as const,
    friendLoans: (friendId: number | string) =>
      ["transaction-accounts", "friend-loans", friendId] as const,
  },
};

export type QueryKey = ReturnType<
  | typeof queryKeys.groups.root
  | typeof queryKeys.groups.list
  | typeof queryKeys.groups.detail
  | typeof queryKeys.groups.members
  | typeof queryKeys.groups.balances
  | typeof queryKeys.groups.settlementPlan
  | typeof queryKeys.balances.summary
  | typeof queryKeys.balances.friend
  | typeof queryKeys.balances.group
  | typeof queryKeys.balances.simplify
  | typeof queryKeys.balances.groupSimplify
  | typeof queryKeys.budgets.list
  | typeof queryKeys.budgets.detail
  | typeof queryKeys.categories.list
  | typeof queryKeys.categories.detail
  | typeof queryKeys.transactions.list
  | typeof queryKeys.transactions.detail
  | typeof queryKeys.transactions.group
  | typeof queryKeys.transactions.friend
  | typeof queryKeys.friends.list
  | typeof queryKeys.friends.requests
  | typeof queryKeys.friends.detail
  | typeof queryKeys.connections.list
  | typeof queryKeys.connections.detail
  | typeof queryKeys.dashboard.summary
  | typeof queryKeys.passbook.list
  | typeof queryKeys.recurringItems.list
  | typeof queryKeys.recurringItems.detail
  | typeof queryKeys.accounts.me
  | typeof queryKeys.accounts.list
  | typeof queryKeys.accounts.detail
  | typeof queryKeys.transactionAccounts.list
  | typeof queryKeys.transactionAccounts.detail
  | typeof queryKeys.transactionAccounts.friendLoans
>;

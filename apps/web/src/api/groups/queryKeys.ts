export const groupsKeys = {
  all: ["groups"] as const,
  lists: () => [...groupsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...groupsKeys.lists(), filters] as const,
  details: () => [...groupsKeys.all, "detail"] as const,
  detail: (id: number) => [...groupsKeys.details(), id] as const,
  members: () => [...groupsKeys.all, "members"] as const,
  membersByGroup: (groupId: number) =>
    [...groupsKeys.members(), groupId] as const,
  balances: () => [...groupsKeys.all, "balances"] as const,
  balancesByGroup: (groupId: number) =>
    [...groupsKeys.balances(), groupId] as const,
  settlementPlan: () => [...groupsKeys.all, "settlement-plan"] as const,
  settlementPlanByGroup: (groupId: number) =>
    [...groupsKeys.settlementPlan(), groupId] as const,
  loans: () => [...groupsKeys.all, "loans"] as const,
  loansByGroup: (groupId: number) => [...groupsKeys.loans(), groupId] as const,
};

export const balancesKeys = {
  all: ["balances"] as const,
  summary: () => [...balancesKeys.all, "summary"] as const,
  friends: () => [...balancesKeys.all, "friends"] as const,
  friendBalance: (userId: number) =>
    [...balancesKeys.friends(), userId] as const,
  groups: () => [...balancesKeys.all, "groups"] as const,
  groupBalance: (groupId: number) =>
    [...balancesKeys.groups(), groupId] as const,
  simplify: () => [...balancesKeys.all, "simplify"] as const,
  groupSimplify: (groupId: number) =>
    [...balancesKeys.simplify(), groupId] as const,
};

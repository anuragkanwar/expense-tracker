export const accountsKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...accountsKeys.lists(), filters] as const,
  details: () => [...accountsKeys.all, "detail"] as const,
  detail: (id: number) => [...accountsKeys.details(), id] as const,
  special: () => [...accountsKeys.all, "special"] as const,
  specialByType: (type: string) => [...accountsKeys.special(), type] as const,
  friends: () => [...accountsKeys.all, "friends"] as const,
  friendLoans: (friendId: number) =>
    [...accountsKeys.friends(), friendId] as const,
};

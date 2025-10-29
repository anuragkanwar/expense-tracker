export const friendsKeys = {
  all: ["friends"] as const,
  lists: () => [...friendsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...friendsKeys.lists(), filters] as const,
  details: () => [...friendsKeys.all, "detail"] as const,
  detail: (id: number) => [...friendsKeys.details(), id] as const,
  requests: () => [...friendsKeys.all, "requests"] as const,
  loans: () => [...friendsKeys.all, "loans"] as const,
  loansByFriend: (friendId: number) =>
    [...friendsKeys.loans(), friendId] as const,
};

export const loansKeys = {
  all: ["loans"] as const,
  lists: () => [...loansKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...loansKeys.lists(), filters] as const,
  details: () => [...loansKeys.all, "detail"] as const,
  detail: (id: number) => [...loansKeys.details(), id] as const,
};

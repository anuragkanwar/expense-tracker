export const budgetsKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...budgetsKeys.lists(), filters] as const,
  details: () => [...budgetsKeys.all, "detail"] as const,
  detail: (id: number) => [...budgetsKeys.details(), id] as const,
};

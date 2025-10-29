export const recurringItemsKeys = {
  all: ["recurring-items"] as const,
  lists: () => [...recurringItemsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...recurringItemsKeys.lists(), filters] as const,
  details: () => [...recurringItemsKeys.all, "detail"] as const,
  detail: (id: number) => [...recurringItemsKeys.details(), id] as const,
};

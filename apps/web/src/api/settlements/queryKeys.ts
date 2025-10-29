export const settlementsKeys = {
  all: ["settlements"] as const,
  details: () => [...settlementsKeys.all, "detail"] as const,
  detail: (id: string) => [...settlementsKeys.details(), id] as const,
};

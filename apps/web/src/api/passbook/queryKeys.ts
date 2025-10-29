export const passbookKeys = {
  all: ["passbook"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...passbookKeys.all, filters] as const,
};

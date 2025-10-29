export const connectionsKeys = {
  all: ["connections"] as const,
  linkToken: () => [...connectionsKeys.all, "link-token"] as const,
  sync: () => [...connectionsKeys.all, "sync"] as const,
  monthlyData: () => [...connectionsKeys.all, "monthly-data"] as const,
};

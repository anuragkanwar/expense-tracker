// Import database connection
export { db } from "./database";
export type {
  DBOrTransactionType,
  DBTransactionType,
  DBType,
} from "./database";

// Export all schema types and utilities
export * from "@pocket-pixie/db-schema";
// Local constants removed in favor of shared enums from @pocket-pixie/db-schema
// export * from "./constants";

// Export auth instance
export { auth } from "./auth";

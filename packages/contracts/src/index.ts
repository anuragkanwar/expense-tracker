// Barrel exports for contracts
// Prevent naming conflicts by exporting models and DTOs separately

// Import everything so we can manage re-exports
import * as allModels from "./models";
import * as allDtos from "./dto";

// Re-export schema types from db-schema for convenience
// This allows apps to import schema constants from @pocket-pixie/contracts
import * as schema from "@pocket-pixie/db-schema";

// Export namespaced versions for consumers who want to avoid conflicts
export { allModels, allDtos, schema };

// Re-export models directly - this is the primary export target
export * from "./models";

// For DTOs, selectively re-export to avoid the conflict with settlement-application types
// Exclude settlement-related exports from dto/settlements.dto (they clash with model exports)
export * from "./dto/balances.dto";
export * from "./dto/budgets.dto";
export * from "./dto/categories.dto";
export * from "./dto/connections.dto";
export * from "./dto/dashboard.dto";
export * from "./dto/friend-request.dto";
export * from "./dto/group-member.dto";
export * from "./dto/groups.dto";
export * from "./dto/passbook.dto";
export * from "./dto/recurring-items.dto";
export * from "./dto/transactions.dto";
export * from "./dto/shared-schemas";
export * from "./dto/auth.dto";

// Re-export database types that are needed by both API and mobile
// These are commonly used enums and constants that should be available everywhere
export {
  ACCOUNT_TYPE,
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  SHARE_TYPE,
  SPLIT_TYPE,
  TXN_TYPE,
} from "@pocket-pixie/db-schema";

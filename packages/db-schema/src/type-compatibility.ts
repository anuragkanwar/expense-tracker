/**
 * Type Compatibility Layer
 *
 * This file provides improved type compatibility between our schema interfaces
 * and the Drizzle SQLite types. This helps avoid type errors when passing
 * transaction objects between services and repositories.
 */
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { ResultSet } from "@libsql/client";

/**
 * Create a compatible transaction type that can be used across the codebase
 * without TypeScript errors when the schemas have compatible structure but
 * different reference identity.
 *
 * This type removes the strict schema checking that causes compatibility issues.
 */
export type CompatibleTransaction = SQLiteTransaction<
  "async",
  ResultSet,
  any, // Replace strict schema type with any
  any // Replace strict tables relation type with any
>;

/**
 * Cast a DBTransactionType to a more compatible transaction type
 * Use this when TypeScript incorrectly reports type incompatibility
 */
export function asCompatibleTransaction<T = CompatibleTransaction>(tx: any): T {
  return tx as T;
}

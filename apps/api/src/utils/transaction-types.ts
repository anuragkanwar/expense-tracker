/**
 * Transaction Type Adapter
 *
 * This file provides type adapters and utilities to improve compatibility between
 * the DBTransactionType interface and transaction objects used throughout the codebase.
 */
import { DBTransactionType, DBType } from "@pocket-pixie/db-schema";

/**
 * Checks if an object is a valid transaction object
 * This is a runtime check to handle type compatibility issues
 */
export function isValidTransaction(tx: any): boolean {
  return (
    tx &&
    typeof tx === "object" &&
    typeof tx.select === "function" &&
    typeof tx.insert === "function" &&
    typeof tx.update === "function" &&
    typeof tx.delete === "function" &&
    typeof tx.rollback === "function"
  );
}

/**
 * Get a database transaction from any valid transaction-like object
 * This helps with type compatibility when passing tx objects between layers
 */
export function getTransactionContext(
  db: DBType,
  tx?: DBTransactionType | null | undefined
): DBType | DBTransactionType {
  if (!tx) {
    return db;
  }

  // Check if it's a valid transaction object
  if (isValidTransaction(tx)) {
    return tx as DBTransactionType;
  }

  // Fall back to using the database directly
  return db;
}

/**
 * Type assertion helper for transaction objects
 * Use this when TypeScript incorrectly reports type incompatibility despite structural compatibility
 */
export function assertTransaction<T = DBTransactionType>(tx: any): T {
  if (!isValidTransaction(tx)) {
    throw new Error("Invalid transaction object");
  }
  return tx as T;
}

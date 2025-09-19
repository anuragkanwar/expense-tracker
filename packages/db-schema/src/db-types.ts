import { ResultSet } from "@libsql/client";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "./index";

// These types must be used in the api by importing from @pocket-pixie/db-schema
export type DBType = ReturnType<
  typeof import("drizzle-orm/libsql").drizzle<{ schema: typeof schema }>
>;

// Define a more permissive transaction type for compatibility
export type DBTransactionType = SQLiteTransaction<
  "async",
  ResultSet,
  any, // Make schema type any to avoid compatibility issues
  any // Make tables relation type any to avoid compatibility issues
>;

export type DBOrTransactionType = DBType | DBTransactionType;

/**
 * Safe cast for transaction objects
 * This is a runtime-safe way to cast any transaction-like object to DBTransactionType
 */
export function asTransaction(tx: any): DBTransactionType {
  if (
    !tx ||
    typeof tx !== "object" ||
    typeof tx.select !== "function" ||
    typeof tx.insert !== "function" ||
    typeof tx.update !== "function"
  ) {
    throw new Error("Invalid transaction object provided");
  }
  return tx as DBTransactionType;
}

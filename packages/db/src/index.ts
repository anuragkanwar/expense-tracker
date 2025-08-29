import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

// Create SQLite database connection
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, "../local.db");
const sqlite = new Database(dbPath);

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Export all schema types and utilities
export * from "./schema.js";

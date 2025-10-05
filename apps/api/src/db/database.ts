import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@pocket-pixie/db-schema";
import {
  DBOrTransactionType,
  DBTransactionType,
  DBType,
} from "@pocket-pixie/db-schema";

// Re-export types for backwards compatibility
export type { DBOrTransactionType, DBTransactionType, DBType };

const localUrl = "http://127.0.0.1:8080";
const databaseUrl = process.env.TURSO_DATABASE_URL || localUrl;

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema, logger: false });

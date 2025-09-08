import { drizzle } from "drizzle-orm/libsql";
import { createClient, ResultSet } from "@libsql/client";
import * as schema from "./schemas/index.js";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

const localUrl = "http://127.0.0.1:8080";
const databaseUrl = process.env.TURSO_DATABASE_URL || localUrl;

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema, logger: true });
export type DBType = typeof db;
export type DBTransactionType = SQLiteTransaction<
  "async",
  ResultSet,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type DBOrTransactionType = DBType | DBTransactionType;
// export { db, DBType, DBTransactionType, DBOrTransactionType };

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schemas/index.js";

// Use libSQL for both local development and production
// This provides consistent behavior across all environments
const databaseUrl = process.env.TURSO_DATABASE_URL || "file:./local.db";
const isLocal = databaseUrl.startsWith("file:");

const client = createClient({
  url: databaseUrl,
  authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

export { db };

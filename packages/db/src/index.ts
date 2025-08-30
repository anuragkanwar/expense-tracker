import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.js";

// Create Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN, // Only needed for remote databases
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export all schema types and utilities
export * from "./schema.js";
export * from "./zod-schemas.js";

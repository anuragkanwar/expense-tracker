import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schemas/index.js";

const localUrl = "http://127.0.0.1:8080";
const databaseUrl = process.env.TURSO_DATABASE_URL || localUrl;

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

export { db };

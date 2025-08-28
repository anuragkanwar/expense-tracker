import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@pocket-pixie/db";

// Create separate database connection for auth
const sqlite = new Database(process.env.AUTH_DATABASE_URL ?? "./auth.db");
const authDb = drizzle(sqlite, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(authDb, {
    provider: "sqlite",
  }),
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "pocket-pixie://",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://YOUR_COMPUTER_IP:3000", // Replace with your computer's IP
  ],
} as any); // Temporary workaround for React 19 compatibility

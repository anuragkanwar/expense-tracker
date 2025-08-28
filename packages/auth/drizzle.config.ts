import type { Config } from "drizzle-kit";

export default {
  schema: "../db/src/schema.ts", // Use the same schema from db package
  out: "./migrations",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL ?? "./auth.db",
  },
  dialect: "sqlite",
} satisfies Config;

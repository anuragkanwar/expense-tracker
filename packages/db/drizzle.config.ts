import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schemas/schema.cjs",
  out: "./migrations",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  },
  dialect: "turso",
} satisfies Config;

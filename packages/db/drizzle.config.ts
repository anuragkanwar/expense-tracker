import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schemas/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8080",
  },
  dialect: "turso",
} satisfies Config;

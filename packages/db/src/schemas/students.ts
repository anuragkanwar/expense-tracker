import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Student table schema - REAL SQLite database schema
export const student = sqliteTable("student", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  age: integer("age"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// TypeScript types generated from the schema
export type Student = typeof student.$inferSelect;
export type NewStudent = typeof student.$inferInsert;

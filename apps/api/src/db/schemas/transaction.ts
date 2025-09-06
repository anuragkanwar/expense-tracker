import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const transaction = sqliteTable("transaction", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

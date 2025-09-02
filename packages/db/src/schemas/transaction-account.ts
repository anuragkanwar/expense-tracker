import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const transactionAccount = sqliteTable("transaction_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["loan", "budget", "investment"] }).notNull(),
  balance: real("balance").notNull().default(0.0),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

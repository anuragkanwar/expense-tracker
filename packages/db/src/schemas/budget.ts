import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { transactionCategory } from "./transaction-category";

export const budget = sqliteTable("budget", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
  startDate: integer("start_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

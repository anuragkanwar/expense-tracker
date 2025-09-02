import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";

export const expense = sqliteTable("expense", {
  id: text("id").primaryKey(),
  groupId: text("group_id").references(() => group.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expenseDate: integer("expense_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

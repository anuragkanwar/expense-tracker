import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";
import { transaction } from "./transaction";

export const loan = sqliteTable("loan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").references(() => group.id, {
    onDelete: "cascade",
  }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  loanDate: integer("loan_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

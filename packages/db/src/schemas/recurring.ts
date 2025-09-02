import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { transactionAccount } from "./transaction-account";

export const recurring = sqliteTable("recurring", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sourcetransactionAccountID: text("source_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  targettransactionAccountID: text("target_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
  type: text("type", { enum: ["CREDIT", "DEBIT"] }).notNull(),
  nextDate: integer("next_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

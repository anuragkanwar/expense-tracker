import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { transactionAccount } from "./transaction-account";
import { RECURRENCE_TYPE, TIME_PERIOD } from "../constants";

export const recurring = sqliteTable("recurring", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sourceTransactionAccountID: integer("source_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  targetTransactionAccountID: integer("target_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  period: text("period", {
    enum: [
      TIME_PERIOD.BIWEEKLY,
      TIME_PERIOD.HALF_YEARLY,
      TIME_PERIOD.MONTHLY,
      TIME_PERIOD.QUATERLY,
      TIME_PERIOD.WEEKLY,
      TIME_PERIOD.YEARLY,
    ],
  }).notNull(),
  type: text("type", {
    enum: [RECURRENCE_TYPE.CREDIT, RECURRENCE_TYPE.DEBIT],
  }).notNull(),
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

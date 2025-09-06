import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { ACCOUNT_TYPE } from "../constants";

export const transactionAccount = sqliteTable("transaction_account", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", {
    enum: [
      ACCOUNT_TYPE.EXPENSE,
      ACCOUNT_TYPE.INCOME,
      ACCOUNT_TYPE.LOAN_GIVEN,
      ACCOUNT_TYPE.LOAN_TAKEN,
      ACCOUNT_TYPE.SAVING,
      ACCOUNT_TYPE.EXTERNAL,
      ACCOUNT_TYPE.OUTGOING,
    ],
  }).notNull(),
  isPaymentSource: integer("is_payment_source", { mode: "boolean" }).notNull(),
  balance: real("balance").notNull().default(0.0),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { transaction } from "./transaction";
import { transactionAccount } from "./transaction-account";
import { transactionCategory } from "./transaction-category";
import { EXPENSE_TYPE } from "@/constants";

export const transactionEntry = sqliteTable("transaction_entry", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  transactionAccountId: text("transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type", {
    enum: [
      EXPENSE_TYPE.EXPENSE,
      EXPENSE_TYPE.INCOME,
      EXPENSE_TYPE.INVESTMENT,
      EXPENSE_TYPE.LOAN_GIVEN,
      EXPENSE_TYPE.LOAN_TAKEN,
    ],
  }).notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

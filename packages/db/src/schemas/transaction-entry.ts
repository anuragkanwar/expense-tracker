import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { transaction } from "./transaction";
import { transactionAccount } from "./transaction-account";
import { transactionCategory } from "./transaction-category";
import { TXN_TYPE } from "@/constants";

export const transactionEntry = sqliteTable("transaction_entry", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  transactionAccountId: integer("transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type", {
    enum: [
      TXN_TYPE.EXPENSE,
      TXN_TYPE.INCOME,
      TXN_TYPE.INVESTMENT,
      TXN_TYPE.LOAN_GIVEN,
      TXN_TYPE.LOAN_TAKEN,
    ],
  }).notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

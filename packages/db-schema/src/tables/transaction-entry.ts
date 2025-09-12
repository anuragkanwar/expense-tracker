import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
import { transaction } from "./transaction";
import { transactionAccount } from "./transaction-account";

export const transactionEntry = sqliteTable("transaction_entry", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  transactionAccountId: integer("transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

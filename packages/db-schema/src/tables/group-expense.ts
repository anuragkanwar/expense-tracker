import {
  sqliteTable,
  integer,
  real,
  text,
} from "drizzle-orm/sqlite-core";
import { transaction } from "./transaction";
import { user } from "./user";
import { group } from "./group";

export const groupExpense = sqliteTable("group_expense", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  groupId: integer("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  payerUserId: integer("payer_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  realizedAt: integer("realized_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

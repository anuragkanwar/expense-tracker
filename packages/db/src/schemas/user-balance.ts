import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { group } from "./group";
import { expense } from "./expense";

export const userBalance = sqliteTable("user_balance", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  counterPartyId: text("counterparty_id")
    .notNull()
    .references(() => expense.id, { onDelete: "cascade" }),
  groupId: text("group_id").references(() => group.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

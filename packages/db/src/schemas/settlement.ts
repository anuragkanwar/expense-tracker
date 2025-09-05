import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";

export const settlement = sqliteTable("settlement", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").references(() => group.id, {
    onDelete: "cascade",
  }),
  payerId: integer("payer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  payeeId: integer("payee_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  setlledAt: integer("settled_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
import { loan } from "./loan";
import { user } from "./user";

export const loanPayer = sqliteTable("loan_payer", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanId: integer("loan_id")
    .notNull()
    .references(() => loan.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amountPaid: real("amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

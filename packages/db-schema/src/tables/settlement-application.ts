import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
import { settlement } from "./settlement";
import { expenseShare } from "./expense-share";

// Allocation of a settlement amount to specific expense shares (FIFO based)
export const settlementApplication = sqliteTable("settlement_application", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settlementId: integer("settlement_id")
    .notNull()
    .references(() => settlement.id, { onDelete: "cascade" }),
  expenseShareId: integer("expense_share_id")
    .notNull()
    .references(() => expenseShare.id, { onDelete: "cascade" }),
  appliedAmount: real("applied_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";
import { expense } from "./expense";
import { user } from "./user";

export const expenseSplit = sqliteTable("expense_split", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expense.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amountOwed: real("amount_owed").notNull(),
  splitType: text("split_type", {
    enum: ["Equal", "Exact", "percentage", "share"],
  }),
  metadata: blob("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

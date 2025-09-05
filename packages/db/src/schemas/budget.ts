import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { transactionCategory } from "./transaction-category";
import { TIME_PERIOD } from "@/constants";

export const budget = sqliteTable("budget", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  period: text("period", {
    enum: [
      TIME_PERIOD.BIWEEKLY,
      TIME_PERIOD.HALF_YEARLY,
      TIME_PERIOD.MONTHLY,
      TIME_PERIOD.QUATERLY,
      TIME_PERIOD.WEEKLY,
      TIME_PERIOD.YEARLY,
    ],
  }).notNull(),
  startDate: integer("start_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

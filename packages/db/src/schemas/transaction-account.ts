import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { EXPENSE_CATEGORY } from "@/constants";

export const transactionAccount = sqliteTable("transaction_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", {
    enum: [
      EXPENSE_CATEGORY.BILLS,
      EXPENSE_CATEGORY.BOOZE,
      EXPENSE_CATEGORY.CAR,
      EXPENSE_CATEGORY.COSMETIC,
      EXPENSE_CATEGORY.DINING_OUT,
      EXPENSE_CATEGORY.ENTERTAINMENT,
      EXPENSE_CATEGORY.GENERAL,
      EXPENSE_CATEGORY.GROCERIES,
      EXPENSE_CATEGORY.GYM,
      EXPENSE_CATEGORY.HEALTHCARE,
      EXPENSE_CATEGORY.INCOME,
      EXPENSE_CATEGORY.INVESTMENT,
      EXPENSE_CATEGORY.ORDERING_IN,
      EXPENSE_CATEGORY.PETS,
      EXPENSE_CATEGORY.RENT,
      EXPENSE_CATEGORY.SAVING,
      EXPENSE_CATEGORY.SHOPPING,
      EXPENSE_CATEGORY.SUBSCRIPTIONS,
      EXPENSE_CATEGORY.TRANSPORTATION,
      EXPENSE_CATEGORY.TRAVEL,
      EXPENSE_CATEGORY.UTILITIES,
    ],
  }).notNull(),
  balance: real("balance").notNull().default(0.0),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

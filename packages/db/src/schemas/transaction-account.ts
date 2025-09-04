import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { TXN_CATEGORY } from "@/constants";

export const transactionAccount = sqliteTable("transaction_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", {
    enum: [
      TXN_CATEGORY.BILLS,
      TXN_CATEGORY.BOOZE,
      TXN_CATEGORY.CAR,
      TXN_CATEGORY.COSMETIC,
      TXN_CATEGORY.DINING_OUT,
      TXN_CATEGORY.ENTERTAINMENT,
      TXN_CATEGORY.GENERAL,
      TXN_CATEGORY.GROCERIES,
      TXN_CATEGORY.GYM,
      TXN_CATEGORY.HEALTHCARE,
      TXN_CATEGORY.INCOME,
      TXN_CATEGORY.INVESTMENT,
      TXN_CATEGORY.ORDERING_IN,
      TXN_CATEGORY.PETS,
      TXN_CATEGORY.RENT,
      TXN_CATEGORY.SAVING,
      TXN_CATEGORY.SHOPPING,
      TXN_CATEGORY.SUBSCRIPTIONS,
      TXN_CATEGORY.TRANSPORTATION,
      TXN_CATEGORY.TRAVEL,
      TXN_CATEGORY.UTILITIES,
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

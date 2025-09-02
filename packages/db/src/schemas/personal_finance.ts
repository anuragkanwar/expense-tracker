import {
  sqliteTable,
  text,
  integer,
  real,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// represent what accounts needs to be tracked for user
export const transactionAccount = sqliteTable("transaction_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Main wallet, chase checking
  type: text("type", { enum: ["loan", "budget", "investment"] }).notNull(),
  balance: real("balance").notNull().default(0.0),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// immutable header table for the ledger
export const transaction = sqliteTable("transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// store user defined and default categories
export const transactionCategory = sqliteTable("transaction_category", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentCategoryId: text("parent_category_id").references(
    (): AnySQLiteColumn => transactionCategory.id
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// core of double-entry sytem.
export const transactionEntry = sqliteTable("transaction_entry", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  transactionAccountId: text("transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  direction: text("direction", { enum: ["DEBIT", "CREDIT"] }).notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

//budgets
export const budget = sqliteTable("budget", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => transactionCategory.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
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

// recurring transactions
// make external, bank, and for all categories
// src => money coming from
// dest => money going to
export const recurring = sqliteTable("recurring", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sourcetransactionAccountID: text("source_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  targettransactionAccountID: text("target_transaction_account_id")
    .notNull()
    .references(() => transactionAccount.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  period: text("period", { enum: ["monthly", "weekly", "yearly"] }).notNull(),
  type: text("type", { enum: ["CREDIT", "DEBIT"] }).notNull(),
  nextDate: integer("next_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

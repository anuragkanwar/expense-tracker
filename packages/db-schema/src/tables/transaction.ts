import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const transaction = sqliteTable("transaction", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  // We'll set up the self-reference through relations to avoid circular dependency
  parentTransactionId: integer("parent_transaction_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Add relations for parent-child transaction relationship
import { relations } from "drizzle-orm";

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  parent: one(transaction, {
    fields: [transaction.parentTransactionId],
    references: [transaction.id],
  }),
  children: many(transaction),
}));

import {
  sqliteTable,
  text,
  integer,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";

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

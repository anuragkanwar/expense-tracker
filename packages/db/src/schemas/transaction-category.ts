import {
  sqliteTable,
  text,
  integer,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";

export const transactionCategory = sqliteTable("transaction_category", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentCategoryId: integer("parent_category_id").references(
    (): AnySQLiteColumn => transactionCategory.id
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

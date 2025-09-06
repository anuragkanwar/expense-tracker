import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";

export const groupMember = sqliteTable("group_member", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

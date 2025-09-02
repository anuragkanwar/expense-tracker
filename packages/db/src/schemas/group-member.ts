import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";

export const groupMember = sqliteTable("group_member", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

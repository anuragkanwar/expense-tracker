import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { FRIEND_STATUS } from "@/constants";

export const friendship = sqliteTable("friendship", {
  id: text("id").primaryKey(),
  userId1: text("user_id_1")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userId2: text("user_id_2")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text({
    enum: [
      FRIEND_STATUS.ACCEPTED,
      FRIEND_STATUS.BLOCKED,
      FRIEND_STATUS.PENDING,
    ],
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

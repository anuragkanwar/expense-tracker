import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { user } from "./user";
import { FRIEND_STATUS } from "../constants";

export const friendship = sqliteTable("friendship", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId1: integer("user_id_1")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userId2: integer("user_id_2")
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

// Unique index to prevent duplicate friendships between same users
export const friendshipUniqueIndex = uniqueIndex("friendship_unique_idx").on(
  friendship.userId1,
  friendship.userId2,
  friendship.status
);

// Performance index for common friendship queries
export const friendshipUserIndex = index("friendship_user_idx").on(
  friendship.userId1,
  friendship.userId2
);

export const friendshipStatusIndex = index("friendship_status_idx").on(
  friendship.status
);

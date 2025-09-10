import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";
import { loan } from "./loan";
import { user } from "./user";
import { SPLIT_TYPE } from "../constants";

export const loanSplit = sqliteTable("loan_split", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanId: integer("loan_id")
    .notNull()
    .references(() => loan.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amountOwed: real("amount_owed").notNull(),
  splitType: text("split_type", {
    enum: [SPLIT_TYPE.EQUAL, SPLIT_TYPE.PERCENTAGE, SPLIT_TYPE.SHARE],
  }),
  metadata: blob("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

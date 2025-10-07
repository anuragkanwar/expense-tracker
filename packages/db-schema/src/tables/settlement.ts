import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { group } from "./group";
import { user } from "./user";

export const settlement = sqliteTable("settlement", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").references(() => group.id, {
    onDelete: "cascade",
  }),
  payerId: integer("payer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  payeeId: integer("payee_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  /**
   * Optional transaction linkage (future: enforce NOT NULL). Represents the
   * ledger transaction capturing the loan reversal for this settlement.
   */
  transactionId: integer("transaction_id"),
  /**
   * Idempotency key supplied via header to prevent duplicate settlements on
   * client retries. Application layer enforces uniqueness for now.
   */
  idempotencyKey: text("idempotency_key"),
  settledAt: integer("settled_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Unique idempotency key index (allows multiple NULLs; enforces uniqueness when provided)
export const settlementIdempotencyKeyIndex = uniqueIndex(
  "settlement_idempotency_key_idx"
).on(settlement.idempotencyKey);

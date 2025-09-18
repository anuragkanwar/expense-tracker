import {
  sqliteTable,
  integer,
  real,
  text,
  blob,
} from "drizzle-orm/sqlite-core";
import { transaction } from "./transaction";
import { user } from "./user";
import { group } from "./group";
import { transactionAccount } from "./transaction-account";
import { EXPENSE_SHARE_TYPE } from "../enums";

// Unified obligation tracking mechanism for both expenses and loans
export const expenseShare = sqliteTable("expense_share", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transaction.id, { onDelete: "cascade" }),
  payerUserId: integer("payer_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  participantUserId: integer("participant_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  groupId: integer("group_id").references(() => group.id, {
    onDelete: "cascade",
  }),
  // New field to distinguish between expense shares and loans
  type: text("type", {
    enum: [EXPENSE_SHARE_TYPE.EXPENSE, EXPENSE_SHARE_TYPE.LOAN],
  })
    .notNull()
    .default(EXPENSE_SHARE_TYPE.EXPENSE),
  // For loans, description stores the loan description
  description: text("description"),
  shareType: text("share_type"), // GROUP | NONE
  splitType: text("split_type"), // EQUAL | PERCENTAGE | SHARE
  expenseAccountId: integer("expense_account_id").references(
    () => transactionAccount.id,
    { onDelete: "set null" }
  ),
  currency: text("currency").notNull(),
  amount: real("amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  status: text("status").notNull().default("UNPAID"), // UNPAID | PARTIALLY_PAID | PAID
  realizedAt: integer("realized_at", { mode: "timestamp" }),
  // For loans, represents when the loan was issued
  loanDate: integer("loan_date", { mode: "timestamp" }),
  isPayerShare: integer("is_payer_share", { mode: "number" })
    .notNull()
    .default(0), // 1 true 0 false
  metadata: blob("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

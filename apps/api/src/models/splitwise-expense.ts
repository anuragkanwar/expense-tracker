import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import {
  group,
  groupMember,
  expense,
  expensePayer,
  expenseSplit,
  userBalance,
  settlement,
} from "@pocket-pixie/db";

// ==========================================================
// GROUP SCHEMAS
// ==========================================================

export const GroupResponseSchema = createSelectSchema(group)
  .extend({
    id: z.string().openapi({
      example: "grp_123",
      description: "Unique group identifier",
    }),
    name: z.string().openapi({
      example: "Trip to Paris",
      description: "Group name",
    }),
    coverPhotoURL: z.string().nullable().openapi({
      example: "https://example.com/photo.jpg",
      description: "Group cover photo URL",
    }),
    createdBy: z.string().openapi({
      example: "user_123",
      description: "User ID who created the group",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the group was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the group was updated",
    }),
  })
  .openapi("GroupResponse");

export const GroupCreateSchema = createInsertSchema(group, {
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "Weekend Getaway",
      description: "Group name",
    }),
  coverPhotoURL: z.string().optional().openapi({
    example: "https://example.com/photo.jpg",
    description: "Group cover photo URL",
  }),
  createdBy: z.string().openapi({
    example: "user_123",
    description: "User ID who created the group",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("GroupCreate");

export const GroupUpdateSchema =
  GroupCreateSchema.partial().openapi("GroupUpdate");

// ==========================================================
// GROUP MEMBER SCHEMAS
// ==========================================================

export const GroupMemberResponseSchema = createSelectSchema(groupMember)
  .extend({
    id: z.string().openapi({
      example: "mem_123",
      description: "Unique member identifier",
    }),
    groupId: z.string().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the member was added",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the member was updated",
    }),
  })
  .openapi("GroupMemberResponse");

export const GroupMemberCreateSchema = createInsertSchema(groupMember, {
  groupId: z.string().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("GroupMemberCreate");

export const GroupMemberUpdateSchema =
  GroupMemberCreateSchema.partial().openapi("GroupMemberUpdate");

// ==========================================================
// EXPENSE SCHEMAS
// ==========================================================

export const ExpenseResponseSchema = createSelectSchema(expense)
  .extend({
    id: z.string().openapi({
      example: "exp_123",
      description: "Unique expense identifier",
    }),
    groupId: z.string().nullable().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    description: z.string().openapi({
      example: "Dinner at restaurant",
      description: "Expense description",
    }),
    amount: z.number().openapi({
      example: 150.0,
      description: "Expense amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdBy: z.string().openapi({
      example: "user_123",
      description: "User ID who created the expense",
    }),
    expenseDate: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Date of expense",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the expense was updated",
    }),
  })
  .openapi("ExpenseResponse");

export const ExpenseCreateSchema = createInsertSchema(expense, {
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .openapi({
      example: "Hotel booking",
      description: "Expense description",
    }),
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 200.0,
    description: "Expense amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "EUR",
      description: "Currency code",
    }),
  expenseDate: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Expense date",
  }),
  groupId: z.string().optional().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
  createdBy: z.string().openapi({
    example: "user_123",
    description: "User ID who created the expense",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpenseCreate");

export const ExpenseUpdateSchema =
  ExpenseCreateSchema.partial().openapi("ExpenseUpdate");

// ==========================================================
// EXPENSE PAYER SCHEMAS
// ==========================================================

export const ExpensePayerResponseSchema = createSelectSchema(expensePayer)
  .extend({
    id: z.string().openapi({
      example: "pay_123",
      description: "Unique payer identifier",
    }),
    expenseId: z.string().openapi({
      example: "exp_123",
      description: "Expense ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID who paid",
    }),
    amountPaid: z.number().openapi({
      example: 75.0,
      description: "Amount paid",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the payer was added",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the payer was updated",
    }),
  })
  .openapi("ExpensePayerResponse");

export const ExpensePayerCreateSchema = createInsertSchema(expensePayer, {
  amountPaid: z.number().min(0, "Amount must be positive").openapi({
    example: 50.0,
    description: "Amount paid",
  }),
  expenseId: z.string().openapi({
    example: "exp_123",
    description: "Expense ID",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID who paid",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpensePayerCreate");

export const ExpensePayerUpdateSchema =
  ExpensePayerCreateSchema.partial().openapi("ExpensePayerUpdate");

// ==========================================================
// EXPENSE SPLIT SCHEMAS
// ==========================================================

export const ExpenseSplitResponseSchema = createSelectSchema(expenseSplit)
  .extend({
    id: z.string().openapi({
      example: "spl_123",
      description: "Unique split identifier",
    }),
    expenseId: z.string().openapi({
      example: "exp_123",
      description: "Expense ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID who owes",
    }),
    amountOwed: z.number().openapi({
      example: 25.0,
      description: "Amount owed",
    }),
    splitType: z
      .enum(["Equal", "Exact", "percentage", "share"])
      .nullable()
      .openapi({
        example: "Equal",
        description: "Split type",
      }),
    metadata: z
      .any()
      .nullable()
      .openapi({
        example: { percentage: 50 },
        description: "Additional split metadata",
      }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the split was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the split was updated",
    }),
  })
  .openapi("ExpenseSplitResponse");

export const ExpenseSplitCreateSchema = createInsertSchema(expenseSplit, {
  amountOwed: z.number().min(0, "Amount must be positive").openapi({
    example: 30.0,
    description: "Amount owed",
  }),
  splitType: z
    .enum(["Equal", "Exact", "percentage", "share"])
    .optional()
    .openapi({
      example: "percentage",
      description: "Split type",
    }),
  metadata: z
    .any()
    .optional()
    .openapi({
      example: { percentage: 30 },
      description: "Additional split metadata",
    }),
  expenseId: z.string().openapi({
    example: "exp_123",
    description: "Expense ID",
  }),
  userId: z.string().openapi({
    example: "user_123",
    description: "User ID who owes",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("ExpenseSplitCreate");

export const ExpenseSplitUpdateSchema =
  ExpenseSplitCreateSchema.partial().openapi("ExpenseSplitUpdate");

// ==========================================================
// USER BALANCE SCHEMAS
// ==========================================================

export const UserBalanceResponseSchema = createSelectSchema(userBalance)
  .extend({
    id: z.string().openapi({
      example: "bal_123",
      description: "Unique balance identifier",
    }),
    ownerId: z.string().openapi({
      example: "user_123",
      description: "Owner user ID",
    }),
    counterPartyId: z.string().openapi({
      example: "exp_123",
      description: "Counterparty ID (expense or user)",
    }),
    groupId: z.string().nullable().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    amount: z.number().openapi({
      example: 15.5,
      description: "Balance amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the balance was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the balance was updated",
    }),
  })
  .openapi("UserBalanceResponse");

export const UserBalanceCreateSchema = createInsertSchema(userBalance, {
  amount: z.number().openapi({
    example: 10.0,
    description: "Balance amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "USD",
      description: "Currency code",
    }),
  ownerId: z.string().openapi({
    example: "user_123",
    description: "Owner user ID",
  }),
  counterPartyId: z.string().openapi({
    example: "exp_123",
    description: "Counterparty ID",
  }),
  groupId: z.string().optional().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("UserBalanceCreate");

export const UserBalanceUpdateSchema =
  UserBalanceCreateSchema.partial().openapi("UserBalanceUpdate");

// ==========================================================
// SETTLEMENT SCHEMAS
// ==========================================================

export const SettlementResponseSchema = createSelectSchema(settlement)
  .extend({
    id: z.string().openapi({
      example: "set_123",
      description: "Unique settlement identifier",
    }),
    groupId: z.string().nullable().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    payerId: z.string().openapi({
      example: "user_123",
      description: "Payer user ID",
    }),
    payeeId: z.string().openapi({
      example: "user_456",
      description: "Payee user ID",
    }),
    amount: z.number().openapi({
      example: 50.0,
      description: "Settlement amount",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Currency code",
    }),
    setlledAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Settlement date",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the settlement was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the settlement was updated",
    }),
  })
  .openapi("SettlementResponse");

export const SettlementCreateSchema = createInsertSchema(settlement, {
  amount: z.number().min(0, "Amount must be positive").openapi({
    example: 25.0,
    description: "Settlement amount",
  }),
  currency: z
    .string()
    .min(3, "Currency code required")
    .max(3, "Invalid currency code")
    .openapi({
      example: "USD",
      description: "Currency code",
    }),
  setlledAt: z.string().optional().openapi({
    example: "2025-09-01T12:00:00.000Z",
    description: "Settlement date",
  }),
  groupId: z.string().optional().openapi({
    example: "grp_123",
    description: "Group ID",
  }),
  payerId: z.string().openapi({
    example: "user_123",
    description: "Payer user ID",
  }),
  payeeId: z.string().openapi({
    example: "user_456",
    description: "Payee user ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("SettlementCreate");

export const SettlementUpdateSchema =
  SettlementCreateSchema.partial().openapi("SettlementUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type GroupResponse = z.infer<typeof GroupResponseSchema>;
export type GroupCreate = z.infer<typeof GroupCreateSchema>;
export type GroupUpdate = z.infer<typeof GroupUpdateSchema>;

export type GroupMemberResponse = z.infer<typeof GroupMemberResponseSchema>;
export type GroupMemberCreate = z.infer<typeof GroupMemberCreateSchema>;
export type GroupMemberUpdate = z.infer<typeof GroupMemberUpdateSchema>;

export type ExpenseResponse = z.infer<typeof ExpenseResponseSchema>;
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseUpdate = z.infer<typeof ExpenseUpdateSchema>;

export type ExpensePayerResponse = z.infer<typeof ExpensePayerResponseSchema>;
export type ExpensePayerCreate = z.infer<typeof ExpensePayerCreateSchema>;
export type ExpensePayerUpdate = z.infer<typeof ExpensePayerUpdateSchema>;

export type ExpenseSplitResponse = z.infer<typeof ExpenseSplitResponseSchema>;
export type ExpenseSplitCreate = z.infer<typeof ExpenseSplitCreateSchema>;
export type ExpenseSplitUpdate = z.infer<typeof ExpenseSplitUpdateSchema>;

export type UserBalanceResponse = z.infer<typeof UserBalanceResponseSchema>;
export type UserBalanceCreate = z.infer<typeof UserBalanceCreateSchema>;
export type UserBalanceUpdate = z.infer<typeof UserBalanceUpdateSchema>;

export type SettlementResponse = z.infer<typeof SettlementResponseSchema>;
export type SettlementCreate = z.infer<typeof SettlementCreateSchema>;
export type SettlementUpdate = z.infer<typeof SettlementUpdateSchema>;

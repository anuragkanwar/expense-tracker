import { z } from "@hono/zod-openapi";

// Balance summary response schema
export const BalanceSummaryResponseSchema = z
  .object({
    totalOwed: z.number().openapi({
      example: 150.0,
      description: "Total amount others owe you",
    }),
    totalOwe: z.number().openapi({
      example: 75.5,
      description: "Total amount you owe others",
    }),
    netBalance: z.number().openapi({
      example: 74.5,
      description:
        "Net balance (positive = you're owed money, negative = you owe money)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Primary currency",
    }),
  })
  .openapi("BalanceSummaryResponse");

// Friend balance response schema
export const FriendBalanceResponseSchema = z
  .object({
    friendId: z.string().openapi({
      example: "user_456",
      description: "Friend's user ID",
    }),
    friendName: z.string().openapi({
      example: "Jane Doe",
      description: "Friend's name",
    }),
    balance: z.number().openapi({
      example: 25.5,
      description:
        "Balance with this friend (positive = they owe you, negative = you owe them)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Balance currency",
    }),
    lastActivity: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "Last activity date",
    }),
  })
  .openapi("FriendBalanceResponse");

// Group balance response schema
export const GroupBalanceResponseSchema = z
  .object({
    groupId: z.string().openapi({
      example: "grp_123",
      description: "Group ID",
    }),
    groupName: z.string().openapi({
      example: "Trip to Paris",
      description: "Group name",
    }),
    balance: z.number().openapi({
      example: -15.25,
      description:
        "Your balance in this group (positive = you're owed, negative = you owe)",
    }),
    currency: z.string().openapi({
      example: "USD",
      description: "Balance currency",
    }),
    memberCount: z.number().openapi({
      example: 4,
      description: "Number of group members",
    }),
  })
  .openapi("GroupBalanceResponse");

// Settlement plan response schema
export const SettlementPlanResponseSchema = z
  .array(
    z.object({
      fromUserId: z.string().openapi({
        example: "user_123",
        description: "User who should pay",
      }),
      fromUserName: z.string().openapi({
        example: "John Doe",
        description: "Name of user who should pay",
      }),
      toUserId: z.string().openapi({
        example: "user_456",
        description: "User who should receive payment",
      }),
      toUserName: z.string().openapi({
        example: "Jane Smith",
        description: "Name of user who should receive payment",
      }),
      amount: z.number().openapi({
        example: 25.5,
        description: "Amount to transfer",
      }),
      currency: z.string().openapi({
        example: "USD",
        description: "Transfer currency",
      }),
    })
  )
  .openapi("SettlementPlanResponse");

// Inferred types
export type BalanceSummaryResponse = z.infer<
  typeof BalanceSummaryResponseSchema
>;
export type FriendBalanceResponse = z.infer<typeof FriendBalanceResponseSchema>;
export type GroupBalanceResponse = z.infer<typeof GroupBalanceResponseSchema>;
export type SettlementPlanResponse = z.infer<
  typeof SettlementPlanResponseSchema
>;

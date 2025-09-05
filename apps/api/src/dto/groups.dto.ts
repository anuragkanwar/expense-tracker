import { z } from "@hono/zod-openapi";

// Group balances response schema
export const GroupBalancesResponseSchema = z
  .array(
    z.object({
      userId: z.number().openapi({
        example: 123,
        description: "User ID",
      }),
      name: z.string().openapi({
        example: "John Doe",
        description: "User name",
      }),
      balance: z.number().openapi({
        example: 25.5,
        description:
          "Net balance (positive = owed to user, negative = owes to others)",
      }),
      currency: z.string().openapi({
        example: "USD",
        description: "Balance currency",
      }),
    })
  )
  .openapi("GroupBalancesResponse");

// Settlement plan response schema
export const SettlementPlanResponseSchema = z
  .array(
    z.object({
      fromUserId: z.number().openapi({
        example: 123,
        description: "User who should pay",
      }),
      fromUserName: z.string().openapi({
        example: "John Doe",
        description: "Name of user who should pay",
      }),
      toUserId: z.number().openapi({
        example: 456,
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
export type GroupBalancesResponse = z.infer<typeof GroupBalancesResponseSchema>;
export type SettlementPlanResponse = z.infer<
  typeof SettlementPlanResponseSchema
>;

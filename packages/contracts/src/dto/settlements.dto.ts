import { z } from "@hono/zod-openapi";
import { SettlementResponseSchema } from "../models/settlement";

// ==============================================
// Settlement Application (allocation fragments)
// ==============================================
export const SettlementApplicationResponseSchema = z
  .object({
    id: z
      .number()
      .openapi({ example: 101, description: "Settlement application id" }),
    settlementId: z
      .number()
      .openapi({ example: 55, description: "Associated settlement id" }),
    expenseShareId: z.number().openapi({
      example: 777,
      description: "Expense share id this fragment applied to",
    }),
    appliedAmount: z.number().openapi({
      example: 12.5,
      description: "Amount applied from settlement to this expense share",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-14T12:00:00.000Z",
      description: "Creation timestamp",
    }),
  })
  .openapi("SettlementApplicationResponse");

// ==============================================
// Allocate Expense Share Settlement Request
// ==============================================
export const ExpenseShareSettlementAllocateRequestSchema = z
  .object({
    payeeId: z.number().int().positive().openapi({
      example: 42,
      description: "Original payer user id (receives the payment)",
    }),
    amount: z.number().positive().openapi({
      example: 50.0,
      description: "Amount to allocate across outstanding expense shares",
    }),
    currency: z
      .string()
      .length(3)
      .openapi({ example: "USD", description: "Three letter currency code" }),
    groupId: z.number().int().positive().optional().openapi({
      example: 123,
      description: "Optional group context for the allocation",
    }),
  })
  .openapi("ExpenseShareSettlementAllocateRequest");

// ==============================================
// Allocate Expense Share Settlement Response
// ==============================================
export const ExpenseShareSettlementAllocateResponseSchema = z
  .object({
    settlement: SettlementResponseSchema,
    applications: z.array(SettlementApplicationResponseSchema).openapi({
      description: "Fragments showing how the settlement was distributed",
    }),
    totalApplied: z.number().openapi({
      example: 50.0,
      description: "Total amount successfully applied",
    }),
    outstandingBefore: z.number().openapi({
      example: 120.0,
      description: "Total outstanding amount before allocation",
    }),
    outstandingAfter: z.number().openapi({
      example: 70.0,
      description: "Total outstanding amount after allocation",
    }),
  })
  .openapi("ExpenseShareSettlementAllocateResponse");

// ==============================================
// Type Exports
// ==============================================
export type SettlementApplicationResponse = z.infer<
  typeof SettlementApplicationResponseSchema
>;
export type ExpenseShareSettlementAllocateRequest = z.infer<
  typeof ExpenseShareSettlementAllocateRequestSchema
>;
export type ExpenseShareSettlementAllocateResponse = z.infer<
  typeof ExpenseShareSettlementAllocateResponseSchema
>;

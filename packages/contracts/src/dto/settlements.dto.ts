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
      description:
        "Original payer/creditor user id (receives the payment). Must be different from authenticated user.",
    }),
    amount: z.number().positive().openapi({
      example: 50.0,
      description:
        "Amount to allocate across outstanding expense shares. Must be positive and not exceed total outstanding.",
    }),
    currency: z.string().length(3).openapi({
      example: "USD",
      description:
        "Three letter currency code. Must match the currency of the outstanding expense shares.",
    }),
    groupId: z.number().int().positive().optional().openapi({
      example: 123,
      description:
        "Optional group context for the allocation. Filters expense shares to only this group if provided.",
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
      description:
        "Fragments showing how the settlement was distributed across expense shares (FIFO order)",
    }),
    totalApplied: z.number().openapi({
      example: 50.0,
      description:
        "Total amount successfully applied (should match request amount)",
    }),
    outstandingBefore: z.number().openapi({
      example: 120.0,
      description:
        "Total outstanding amount before allocation between these users",
    }),
    outstandingAfter: z.number().openapi({
      example: 70.0,
      description:
        "Remaining outstanding amount after allocation between these users",
    }),
  })
  .openapi("ExpenseShareSettlementAllocateResponse");

// ==============================================
// Settlement Application Create Schema
// ==============================================
export const SettlementApplicationCreateSchema = z
  .object({
    settlementId: z.number().int().positive().openapi({
      example: 55,
      description: "Associated settlement id",
    }),
    expenseShareId: z.number().int().positive().openapi({
      example: 777,
      description: "Expense share id this fragment applies to",
    }),
    appliedAmount: z.number().positive().openapi({
      example: 12.5,
      description: "Amount applied from settlement to this expense share",
    }),
  })
  .openapi("SettlementApplicationCreate");

// ==============================================
// Type Exports
// ==============================================
export type SettlementApplicationResponse = z.infer<
  typeof SettlementApplicationResponseSchema
>;
export type SettlementApplicationCreate = z.infer<
  typeof SettlementApplicationCreateSchema
>;
export type ExpenseShareSettlementAllocateRequest = z.infer<
  typeof ExpenseShareSettlementAllocateRequestSchema
>;
export type ExpenseShareSettlementAllocateResponse = z.infer<
  typeof ExpenseShareSettlementAllocateResponseSchema
>;

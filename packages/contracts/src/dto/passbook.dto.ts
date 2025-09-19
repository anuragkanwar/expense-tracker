import { z } from "@hono/zod-openapi";
import { TransactionResponseSchema } from "../models/transaction";
import { TransactionAccountResponseSchema } from "../models/transaction-account";

// First define the shape of our data
export interface IPassbookEntryResponse {
  id: number;
  amount: number;
  transactionAccountId: number;
  transactionId: number;
  createdAt: string;
  updatedAt: string;
  transaction: z.infer<typeof TransactionResponseSchema>;
  transactionAccount: z.infer<typeof TransactionAccountResponseSchema>;
  isExpenseShare?: boolean;
  expenseShareType?: string;
  expenseShareId?: number;
  payerUserId?: number;
  participantUserId?: number;
  payerName?: string;
  participantName?: string;
  groupId?: number;
  status?: string;
}

// Custom passbook entry response with related data
export const PassbookEntryResponseSchema: z.ZodType<any> = z
  .object({
    id: z.number(),
    amount: z.number(),
    transactionAccountId: z.number(),
    transactionId: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    transaction: TransactionResponseSchema,
    transactionAccount: TransactionAccountResponseSchema,
    // Expense share fields (optional, only present for expense share entries)
    isExpenseShare: z.boolean().optional(),
    expenseShareType: z.string().optional(),
    expenseShareId: z.number().optional(),
    payerUserId: z.number().optional(),
    participantUserId: z.number().optional(),
    payerName: z.string().optional(),
    participantName: z.string().optional(),
    groupId: z.number().optional(),
    status: z.string().optional(),
  })
  .openapi("PassbookEntryResponse");

// Define the interface for the response type
export interface IPassbookResponse {
  entries: IPassbookEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

// Passbook list response with pagination
export const PassbookResponseSchema: z.ZodType<any> = z
  .object({
    entries: z.array(PassbookEntryResponseSchema).openapi({
      description: "List of transaction entries with related data",
    }),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
  })
  .openapi("PassbookResponse");

// Passbook filters interface
export interface PassbookFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  accountId?: number;
  entryType?: "transaction" | "expense" | "loan" | "all";
  status?: "unpaid" | "partially_paid" | "paid" | "all";
  [key: string]: unknown; // Index signature to maintain compatibility with existing code
}

// Passbook query result interface
export interface PassbookQueryResult {
  entries: PassbookEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

// Inferred types
export type PassbookEntryResponse = z.infer<typeof PassbookEntryResponseSchema>;
export type PassbookResponse = z.infer<typeof PassbookResponseSchema>;

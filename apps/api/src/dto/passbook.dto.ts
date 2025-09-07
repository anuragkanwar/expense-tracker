import { z } from "@hono/zod-openapi";
import { TransactionResponseSchema } from "@/models/transaction";
import { TransactionAccountResponseSchema } from "@/models/transaction-account";

// Custom passbook entry response with related data
export const PassbookEntryResponseSchema = z
  .object({
    id: z.number(),
    amount: z.number(),
    transactionAccountId: z.number(),
    transactionId: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    transaction: TransactionResponseSchema,
    transactionAccount: TransactionAccountResponseSchema,
  })
  .openapi("PassbookEntryResponse");

// Passbook list response with pagination
export const PassbookResponseSchema = z
  .object({
    entries: z.array(PassbookEntryResponseSchema).openapi({
      description: "List of transaction entries with related data",
    }),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
  })
  .openapi("PassbookResponse");

// Inferred types
export type PassbookEntryResponse = z.infer<typeof PassbookEntryResponseSchema>;
export type PassbookResponse = z.infer<typeof PassbookResponseSchema>;

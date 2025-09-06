import { z } from "@hono/zod-openapi";
import { TransactionEntryResponseSchema } from "@/models/transaction-entry";

// Passbook list response with pagination
export const PassbookResponseSchema = z
  .object({
    entries: z.array(TransactionEntryResponseSchema).openapi({
      description: "List of transaction entries",
    }),
    total: z.number().openapi({ example: 100 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
  })
  .openapi("PassbookResponse");

// Inferred types
export type PassbookResponse = z.infer<typeof PassbookResponseSchema>;

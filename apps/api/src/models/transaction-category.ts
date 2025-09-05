import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { transactionCategory } from "@pocket-pixie/db";

export const TransactionCategoryResponseSchema = createSelectSchema(
  transactionCategory
)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique category identifier",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
    name: z.string().openapi({
      example: "Food",
      description: "Category name",
    }),
    parentCategoryId: z.number().nullable().openapi({
      example: 456,
      description: "Parent category ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the category was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the category was updated",
    }),
  })
  .openapi("TransactionCategoryResponse");

export const TransactionCategoryCreateSchema = createInsertSchema(
  transactionCategory,
  {
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Groceries",
        description: "Category name",
      }),
    parentCategoryId: z.number().optional().openapi({
      example: 456,
      description: "Parent category ID",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("TransactionCategoryCreate");

export const TransactionCategoryUpdateSchema =
  TransactionCategoryCreateSchema.partial().openapi(
    "TransactionCategoryUpdate"
  );

export type TransactionCategoryResponse = z.infer<
  typeof TransactionCategoryResponseSchema
>;
export type TransactionCategoryCreate = z.infer<
  typeof TransactionCategoryCreateSchema
>;
export type TransactionCategoryUpdate = z.infer<
  typeof TransactionCategoryUpdateSchema
>;

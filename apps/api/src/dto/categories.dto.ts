import { z } from "@hono/zod-openapi";

// Category response schema
export const CategoryResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "cat_123",
      description: "Unique category identifier",
    }),
    name: z.string().openapi({
      example: "Food & Dining",
      description: "Category name",
    }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Category type",
    }),
    parentCategoryId: z.string().nullable().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "User ID",
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
  .openapi("CategoryResponse");

// Category create schema
export const CategoryCreateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .openapi({
        example: "Groceries",
        description: "Category name",
      }),
    type: z.enum(["income", "expense"]).openapi({
      example: "expense",
      description: "Category type",
    }),
    parentCategoryId: z.string().optional().openapi({
      example: "cat_456",
      description: "Parent category ID",
    }),
  })
  .openapi("CategoryCreate");

// Inferred types
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;

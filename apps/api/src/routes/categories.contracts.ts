import { createRoute, z } from "@hono/zod-openapi";
import {
  CategoryResponseSchema,
  CategoryCreateSchema,
} from "@/dto/categories.dto";

export const getCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List categories",
  description:
    "Lists all available transaction categories (both income and expense).",
  tags: ["Categories"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .array(CategoryResponseSchema)
            .openapi("CategoriesListResponse"),
        },
      },
      description: "Categories retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create category",
  description: "Creates a new custom category.",
  tags: ["Categories"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CategoryCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
      description: "Category created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const updateCategoryRoute = createRoute({
  method: "put",
  path: "/{categoryId}",
  summary: "Update category",
  description: "Updates a custom category.",
  tags: ["Categories"],
  request: {
    params: z.object({
      categoryId: z.string().openapi({
        example: "cat_123",
        description: "Category ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: CategoryCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
      description: "Category updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Category not found" },
  },
});

export const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{categoryId}",
  summary: "Delete category",
  description: "Deletes a custom category.",
  tags: ["Categories"],
  request: {
    params: z.object({
      categoryId: z.string().openapi({
        example: "cat_123",
        description: "Category ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Category deleted successfully" }),
          }),
        },
      },
      description: "Category deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Category not found" },
  },
});

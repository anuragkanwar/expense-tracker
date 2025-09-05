import { createRoute, z } from "@hono/zod-openapi";
import { RecurringResponseSchema } from "@/models/recurring";
import { RecurringItemCreateSchema } from "@/dto/recurring-items.dto";

export const getRecurringItemsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List recurring items",
  description: "Lists all recurring items (income and expenses).",
  tags: ["Recurring Items"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .array(RecurringResponseSchema)
            .openapi("RecurringItemsListResponse"),
        },
      },
      description: "Recurring items retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

export const createRecurringItemRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create recurring item",
  description: "Creates a new recurring item.",
  tags: ["Recurring Items"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RecurringItemCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item created successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
  },
});

export const getRecurringItemRoute = createRoute({
  method: "get",
  path: "/{itemId}",
  summary: "Get recurring item details",
  description: "Retrieves details for a single recurring item.",
  tags: ["Recurring Items"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item details retrieved successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

export const updateRecurringItemRoute = createRoute({
  method: "put",
  path: "/{itemId}",
  summary: "Update recurring item",
  description: "Updates a recurring item.",
  tags: ["Recurring Items"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: RecurringItemCreateSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RecurringResponseSchema,
        },
      },
      description: "Recurring item updated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

export const deleteRecurringItemRoute = createRoute({
  method: "delete",
  path: "/{itemId}",
  summary: "Delete recurring item",
  description: "Deletes a recurring item.",
  tags: ["Recurring Items"],
  request: {
    params: z.object({
      itemId: z.string().openapi({
        example: "rec_123",
        description: "Recurring item ID",
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
              .openapi({ example: "Recurring item deleted successfully" }),
          }),
        },
      },
      description: "Recurring item deleted successfully",
    },
    401: { description: "Unauthorized" },
    404: { description: "Recurring item not found" },
  },
});

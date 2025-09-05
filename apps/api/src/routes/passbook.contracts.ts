import { createRoute, z } from "@hono/zod-openapi";
import { PassbookResponseSchema } from "@/dto/passbook.dto";

export const getPassbookRoute = createRoute({
  method: "get",
  path: "/passbook",
  summary: "Get passbook entries",
  description:
    "Retrieves a paginated, chronological list of all transaction entries for the current user's accounts. Supports filtering by date range, category, and account.",
  tags: ["Passbook"],
  request: {
    query: z.object({
      page: z.string().optional().openapi({
        example: "1",
        description: "Page number",
      }),
      limit: z.string().optional().openapi({
        example: "20",
        description: "Items per page",
      }),
      startDate: z.string().optional().openapi({
        example: "2025-01-01T00:00:00.000Z",
        description: "Filter by start date",
      }),
      endDate: z.string().optional().openapi({
        example: "2025-12-31T23:59:59.999Z",
        description: "Filter by end date",
      }),
      categoryId: z.string().optional().openapi({
        example: "cat_123",
        description: "Filter by category",
      }),
      accountId: z.string().optional().openapi({
        example: "acc_123",
        description: "Filter by account",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PassbookResponseSchema,
        },
      },
      description: "Passbook entries retrieved successfully",
    },
    401: { description: "Unauthorized" },
  },
});

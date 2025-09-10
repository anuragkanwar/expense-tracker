import { createRoute } from "@hono/zod-openapi";
import {
  LinkTokenRequestSchema,
  LinkTokenResponseSchema,
  SyncRequestSchema,
  SyncResponseSchema,
  MonthlyDataRequestSchema,
  MonthlyDataResponseSchema,
} from "@/dto/connections.dto";

export const createLinkTokenRoute = createRoute({
  method: "post",
  path: "/link-token",
  summary: "Generate link token",
  description:
    "Generates a short-lived link token from the third-party provider, which the client application uses to initiate the secure account linking flow.",
  tags: ["Connections"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LinkTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LinkTokenResponseSchema,
        },
      },
      description: "Link token generated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    500: { description: "Provider Error" },
  },
});

export const syncConnectionsRoute = createRoute({
  method: "post",
  path: "/sync",
  summary: "Sync connected accounts",
  description:
    "Allows the user to manually trigger a data synchronization process for their connected accounts.",
  tags: ["Connections"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SyncRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SyncResponseSchema,
        },
      },
      description: "Sync initiated successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    429: { description: "Too Many Requests" },
  },
});

export const getMonthlyDataRoute = createRoute({
  method: "get",
  path: "/monthly-data",
  summary: "Get monthly financial data",
  description:
    "Retrieves aggregated financial data for a specific month and year. Used for homepage dashboard and historical analysis.",
  tags: ["Connections"],
  request: {
    query: MonthlyDataRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MonthlyDataResponseSchema,
        },
      },
      description: "Monthly data retrieved successfully",
    },
    400: { description: "Validation Error" },
    401: { description: "Unauthorized" },
    404: { description: "No data found for period" },
  },
});

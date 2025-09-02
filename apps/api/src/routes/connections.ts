import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createLinkTokenRoute,
  syncConnectionsRoute,
  getMonthlyDataRoute,
} from "./connections.contracts";

export const connectionRoutes = new OpenAPIHono();

connectionRoutes.openapi(createLinkTokenRoute, async (c) => {
  // TODO: Implement generate link token
  return c.json({ message: "Not implemented" }, 501);
});

connectionRoutes.openapi(syncConnectionsRoute, async (c) => {
  // TODO: Implement sync connected accounts
  return c.json({ message: "Not implemented" }, 501);
});

connectionRoutes.openapi(getMonthlyDataRoute, async (c) => {
  // TODO: Implement get monthly financial data
  return c.json({ message: "Not implemented" }, 501);
});

import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getRecurringItemsRoute,
  createRecurringItemRoute,
  getRecurringItemRoute,
  updateRecurringItemRoute,
  deleteRecurringItemRoute,
} from "./recurring-items.contracts";

export const recurringItemRoutes = new OpenAPIHono();

recurringItemRoutes.openapi(getRecurringItemsRoute, async (c) => {
  // TODO: Implement get recurring items
  return c.json({ message: "Not implemented" }, 501);
});

recurringItemRoutes.openapi(createRecurringItemRoute, async (c) => {
  // TODO: Implement create recurring item
  return c.json({ message: "Not implemented" }, 501);
});

recurringItemRoutes.openapi(getRecurringItemRoute, async (c) => {
  // TODO: Implement get recurring item
  return c.json({ message: "Not implemented" }, 501);
});

recurringItemRoutes.openapi(updateRecurringItemRoute, async (c) => {
  // TODO: Implement update recurring item
  return c.json({ message: "Not implemented" }, 501);
});

recurringItemRoutes.openapi(deleteRecurringItemRoute, async (c) => {
  // TODO: Implement delete recurring item
  return c.json({ message: "Not implemented" }, 501);
});

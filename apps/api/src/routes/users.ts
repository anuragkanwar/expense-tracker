import { OpenAPIHono } from "@hono/zod-openapi";
import { getCurrentUserRoute, updateCurrentUserRoute } from "./users.contracts";

export const userRoutes = new OpenAPIHono();

userRoutes.openapi(getCurrentUserRoute, async (c) => {
  // TODO: Implement get current user
  return c.json({ message: "Not implemented" }, 501);
});

userRoutes.openapi(updateCurrentUserRoute, async (c) => {
  // TODO: Implement update current user
  return c.json({ message: "Not implemented" }, 501);
});

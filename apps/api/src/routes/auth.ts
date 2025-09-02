import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute, loginRoute, logoutRoute } from "./auth.contracts";

export const authRoutes = new OpenAPIHono();

authRoutes.openapi(registerRoute, async (c) => {
  // TODO: Implement user registration
  return c.json({ message: "Not implemented" }, 501);
});

authRoutes.openapi(loginRoute, async (c) => {
  // TODO: Implement user login
  return c.json({ message: "Not implemented" }, 501);
});

authRoutes.openapi(logoutRoute, async (c) => {
  // TODO: Implement user logout
  return c.json({ message: "Not implemented" }, 501);
});

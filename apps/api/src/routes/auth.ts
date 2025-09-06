import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute } from "./auth.contracts";
import { auth } from "@pocket-pixie/db";
export const authRoutes = new OpenAPIHono();

authRoutes.openapi(registerRoute, async (c) => {
  try {
    const { transactionAccountService } = c.get("services");
    const data = await auth.handler(c.req.raw);
    const dt = await data.body?.json();
    return data;
  } catch (error: any) {
    return c.json({ error: error }, 500);
  }
});

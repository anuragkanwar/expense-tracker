import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute } from "./auth.contracts";
export const authRoutes = new OpenAPIHono();
import { auth } from "@/db";

authRoutes.openapi(registerRoute, async (c) => {
  try {
    const { authService } = c.get("services");
    const validatedData = c.req.valid("json");
    const result = await authService.signUp(validatedData);
    return c.json(result.response, {
      headers: result.headers,
    });
  } catch (error: any) {
    return c.json({ error: error }, 500);
  }
});

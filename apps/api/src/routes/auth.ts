import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute, loginRoute, logoutRoute } from "./auth.contracts";
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

authRoutes.openapi(loginRoute, async (c) => {
  try {
    const validatedData = c.req.valid("json");
    const { headers, response } = await auth.api.signInEmail({
      returnHeaders: true,
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });
    return c.json(response, { headers });
  } catch (error: any) {
    return c.json({ error: error.message || error }, 401);
  }
});

authRoutes.openapi(logoutRoute, async (c) => {
  try {
    const { headers, response } = await auth.api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    return c.json(response, { headers });
  } catch (error: any) {
    return c.json({ error: error.message || error }, 500);
  }
});

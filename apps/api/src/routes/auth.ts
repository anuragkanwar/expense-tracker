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
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

authRoutes.openapi(logoutRoute, async (c) => {
  try {
    const { headers, response } = await auth.api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    return c.json(response, { headers });
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

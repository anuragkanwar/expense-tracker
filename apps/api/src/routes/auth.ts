import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute, loginRoute, logoutRoute } from "./auth.contracts";
import { auth } from "@pocket-pixie/db";
export const authRoutes = new OpenAPIHono();

authRoutes.openapi(registerRoute, async (c) => {
  const validatedData = c.req.valid("json");
  try {
    const data = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        name: validatedData.name,
        password: validatedData.password,
      },
    });

    return c.json(
      {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        },
        session: {
          token: data.token,
        },
      },
      200
    );
  } catch (error: any) {
    return c.json({ error: error }, 500);
  }
});

authRoutes.openapi(loginRoute, async (c) => {
  const validatedData = c.req.valid("json");
  try {
    const data = await auth.api.signInEmail({
      body: {
        email: validatedData.email,
        password: validatedData.password,
      },
    });

    return c.json(
      {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        },
        session: {
          token: data.token,
        },
      },
      200
    );
  } catch (error: any) {
    return c.json({ error: error }, 500);
  }
});

authRoutes.openapi(logoutRoute, async (c) => {
  try {
    const data = await auth.api.signOut({
      headers: c.req.header(),
    });

    return c.json(JSON.stringify(data), 200);
  } catch (error: any) {
    return c.json({ error: error }, 500);
  }
});

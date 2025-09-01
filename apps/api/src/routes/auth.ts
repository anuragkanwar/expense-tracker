import { OpenAPIHono } from "@hono/zod-openapi";
import { signInRoute, signOutRoute, signUpRoute } from "./auth.contracts";
import { SignIn, SignUp } from "@/models/auth";

import { auth } from "@pocket-pixie/db"

export const authRoutes = new OpenAPIHono();

authRoutes.openapi(signUpRoute, async (c) => {
  try {
    return auth.handler(c.req.raw);
  } catch (error: any) {
    return c.json({ error }, 500);
  }
});

authRoutes.openapi(signInRoute, async (c) => {
  try {
    return auth.handler(c.req.raw);
  } catch (error: any) {
    return c.json({ error }, 500);
  }
});


authRoutes.openapi(signOutRoute, async (c) => {
  try {
    return auth.handler(c.req.raw);
  } catch (error: any) {
    return c.json({ error }, 500);
  }
})

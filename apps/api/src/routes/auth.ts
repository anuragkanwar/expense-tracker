import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoute } from "./auth.contracts";
import { auth } from "@pocket-pixie/db";
export const authRoutes = new OpenAPIHono();

authRoutes.openapi(registerRoute, async (c) => {
  try {
    const { transactionAccountService } = c.get("services");
    const validatedData = c.req.valid("json");
    const data = await auth.api.signUpEmail({
      body: {
        email: validatedData.email,
        name: validatedData.name,
        password: validatedData.password,
      },
    });
    transactionAccountService.seedInitialAccounts(parseInt(data.user.id));
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

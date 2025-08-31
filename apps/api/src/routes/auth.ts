import { Hono } from "hono";
import { auth } from "@pocket-pixie/db";

const authRoutes = new Hono();

// Better Auth handler for Hono
authRoutes.all("/*", async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });

  const response = await auth.handler(request);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default authRoutes;

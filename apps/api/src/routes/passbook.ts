import { OpenAPIHono } from "@hono/zod-openapi";
import { getPassbookRoute } from "./passbook.contracts";

export const passbookRoutes = new OpenAPIHono();

passbookRoutes.openapi(getPassbookRoute, async (c) => {
  // TODO: Implement get passbook entries
  return c.json({ message: "Not implemented" }, 501);
});

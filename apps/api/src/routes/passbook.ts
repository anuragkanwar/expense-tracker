import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createTransactionRoute,
  getPassbookRoute,
  getAccountsRoute,
  getAccountBalanceRoute,
} from "./passbook.contracts";

export const passbookRoutes = new OpenAPIHono();

passbookRoutes.openapi(createTransactionRoute, async (c) => {
  // TODO: Implement create transaction
  return c.json({ message: "Not implemented" }, 501);
});

passbookRoutes.openapi(getPassbookRoute, async (c) => {
  // TODO: Implement get passbook entries
  return c.json({ message: "Not implemented" }, 501);
});

passbookRoutes.openapi(getAccountsRoute, async (c) => {
  // TODO: Implement get user accounts
  return c.json({ message: "Not implemented" }, 501);
});

passbookRoutes.openapi(getAccountBalanceRoute, async (c) => {
  // TODO: Implement get account balance
  return c.json({ message: "Not implemented" }, 501);
});

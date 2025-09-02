import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getAccountsRoute,
  createAccountRoute,
  getAccountRoute,
  updateAccountRoute,
  deleteAccountRoute,
} from "./accounts.contracts";

export const accountRoutes = new OpenAPIHono();

accountRoutes.openapi(getAccountsRoute, async (c) => {
  // TODO: Implement get user accounts
  return c.json({ message: "Not implemented" }, 501);
});

accountRoutes.openapi(createAccountRoute, async (c) => {
  // TODO: Implement create account
  return c.json({ message: "Not implemented" }, 501);
});

accountRoutes.openapi(getAccountRoute, async (c) => {
  // TODO: Implement get account
  return c.json({ message: "Not implemented" }, 501);
});

accountRoutes.openapi(updateAccountRoute, async (c) => {
  // TODO: Implement update account
  return c.json({ message: "Not implemented" }, 501);
});

accountRoutes.openapi(deleteAccountRoute, async (c) => {
  // TODO: Implement delete account
  return c.json({ message: "Not implemented" }, 501);
});

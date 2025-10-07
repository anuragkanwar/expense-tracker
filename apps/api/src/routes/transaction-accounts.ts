import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getAccountsRoute,
  createAccountRoute,
  getAccountRoute,
  updateAccountRoute,
  deleteAccountRoute,
  getSpecialAccountRoute,
  getFriendsLoanAccountsRoute,
} from "./transaction-accounts.contracts";
import { handleRouteError } from "@/utils/error-response-handler";

export const accountRoutes = new OpenAPIHono();

accountRoutes.openapi(getAccountsRoute, async (c) => {
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const accounts = await transactionAccountService.getAll(user);
    return c.json(accounts, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(createAccountRoute, async (c) => {
  const data = c.req.valid("json");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const account = await transactionAccountService.create(data, user);
    return c.json(account, 201);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(getAccountRoute, async (c) => {
  const { accountId } = c.req.valid("param");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const account = await transactionAccountService.getById(accountId, user);
    return c.json(account, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(updateAccountRoute, async (c) => {
  const { accountId } = c.req.valid("param");
  const data = c.req.valid("json");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const account = await transactionAccountService.update(
      accountId,
      data,
      user
    );
    return c.json(account, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(deleteAccountRoute, async (c) => {
  const { accountId } = c.req.valid("param");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    await transactionAccountService.delete(accountId, user);
    return c.json({ message: "Account deleted successfully" }, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(getSpecialAccountRoute, async (c) => {
  const { type } = c.req.valid("param");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const account = await transactionAccountService.getSpecialAccount(
      user,
      type
    );
    return c.json(account, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

accountRoutes.openapi(getFriendsLoanAccountsRoute, async (c) => {
  const { friendId } = c.req.valid("param");
  const { transactionAccountService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Not authenticated"));
    return c.json(json, status);
  }
  try {
    const accounts = await transactionAccountService.getFriendsLoanAccounts(
      friendId,
      user
    );
    return c.json(accounts, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

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

export const accountRoutes = new OpenAPIHono();

accountRoutes.openapi(getAccountsRoute, async (c) => {
  try {
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const accounts = await transactionAccountService.getAll(user);
    return c.json(accounts, 200);
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(createAccountRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const account = await transactionAccountService.create(data, user);
    return c.json(account, 201);
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(getAccountRoute, async (c) => {
  try {
    const { accountId } = c.req.valid("param");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const account = await transactionAccountService.getById(accountId, user);
    return c.json(account, 200);
  } catch (error: any) {
    if (error.message === "Account not found") {
      return c.json({ message: error.message }, 404);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(updateAccountRoute, async (c) => {
  try {
    const { accountId } = c.req.valid("param");
    const data = c.req.valid("json");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const account = await transactionAccountService.update(
      accountId,
      data,
      user
    );
    return c.json(account, 200);
  } catch (error: any) {
    if (error.message === "Account not found") {
      return c.json({ message: error.message }, 404);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(deleteAccountRoute, async (c) => {
  try {
    const { accountId } = c.req.valid("param");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    await transactionAccountService.delete(accountId, user);
    return c.json({ message: "Account deleted successfully" }, 200);
  } catch (error: any) {
    if (error.message === "Account not found") {
      return c.json({ message: error.message }, 404);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(getSpecialAccountRoute, async (c) => {
  try {
    const { type } = c.req.valid("param");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const account = await transactionAccountService.getSpecialAccount(
      user,
      type
    );
    return c.json(account, 200);
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

accountRoutes.openapi(getFriendsLoanAccountsRoute, async (c) => {
  try {
    const { friendId } = c.req.valid("param");
    const { transactionAccountService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const accounts = await transactionAccountService.getFriendsLoanAccounts(
      friendId,
      user
    );
    return c.json(accounts, 200);
  } catch (error: any) {
    if (error.message === "You can only view loan accounts of your friends") {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

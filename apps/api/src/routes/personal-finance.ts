import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createAccountRoute,
  getAccountRoute,
  updateAccountRoute,
  deleteAccountRoute,
  getCategoriesRoute,
  createCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute,
  getBudgetRoute,
  updateBudgetRoute,
  deleteBudgetRoute,
  getRecurringItemsRoute,
  createRecurringItemRoute,
  getRecurringItemRoute,
  updateRecurringItemRoute,
  deleteRecurringItemRoute,
} from "./personal-finance.contracts";

export const personalFinanceRoutes = new OpenAPIHono();

// Account routes
personalFinanceRoutes.openapi(createAccountRoute, async (c) => {
  // TODO: Implement create account
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(getAccountRoute, async (c) => {
  // TODO: Implement get account
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(updateAccountRoute, async (c) => {
  // TODO: Implement update account
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(deleteAccountRoute, async (c) => {
  // TODO: Implement delete account
  return c.json({ message: "Not implemented" }, 501);
});

// Category routes
personalFinanceRoutes.openapi(getCategoriesRoute, async (c) => {
  // TODO: Implement get categories
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(createCategoryRoute, async (c) => {
  // TODO: Implement create category
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(updateCategoryRoute, async (c) => {
  // TODO: Implement update category
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(deleteCategoryRoute, async (c) => {
  // TODO: Implement delete category
  return c.json({ message: "Not implemented" }, 501);
});

// Budget routes
personalFinanceRoutes.openapi(getBudgetRoute, async (c) => {
  // TODO: Implement get budget
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(updateBudgetRoute, async (c) => {
  // TODO: Implement update budget
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(deleteBudgetRoute, async (c) => {
  // TODO: Implement delete budget
  return c.json({ message: "Not implemented" }, 501);
});

// Recurring items routes
personalFinanceRoutes.openapi(getRecurringItemsRoute, async (c) => {
  // TODO: Implement get recurring items
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(createRecurringItemRoute, async (c) => {
  // TODO: Implement create recurring item
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(getRecurringItemRoute, async (c) => {
  // TODO: Implement get recurring item
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(updateRecurringItemRoute, async (c) => {
  // TODO: Implement update recurring item
  return c.json({ message: "Not implemented" }, 501);
});

personalFinanceRoutes.openapi(deleteRecurringItemRoute, async (c) => {
  // TODO: Implement delete recurring item
  return c.json({ message: "Not implemented" }, 501);
});

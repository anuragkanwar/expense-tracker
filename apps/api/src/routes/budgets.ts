import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getBudgetsRoute,
  createBudgetRoute,
  getBudgetRoute,
  updateBudgetRoute,
  deleteBudgetRoute,
} from "./budgets.contracts";

export const budgetRoutes = new OpenAPIHono();

budgetRoutes.openapi(getBudgetsRoute, async (c) => {
  // TODO: Implement get budgets
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(createBudgetRoute, async (c) => {
  // TODO: Implement create budget
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(getBudgetRoute, async (c) => {
  // TODO: Implement get budget
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(updateBudgetRoute, async (c) => {
  // TODO: Implement update budget
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(deleteBudgetRoute, async (c) => {
  // TODO: Implement delete budget
  return c.json({ message: "Not implemented" }, 501);
});

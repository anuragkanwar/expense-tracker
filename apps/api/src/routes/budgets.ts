import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createBudgetRoute,
  getBudgetsRoute,
  getSubscriptionsRoute,
  createGoalRoute,
  getGoalsRoute,
} from "./budgets.contracts";

export const budgetRoutes = new OpenAPIHono();

budgetRoutes.openapi(createBudgetRoute, async (c) => {
  // TODO: Implement create budget
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(getBudgetsRoute, async (c) => {
  // TODO: Implement get budgets with status
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(getSubscriptionsRoute, async (c) => {
  // TODO: Implement get recurring payments
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(createGoalRoute, async (c) => {
  // TODO: Implement create savings goal
  return c.json({ message: "Not implemented" }, 501);
});

budgetRoutes.openapi(getGoalsRoute, async (c) => {
  // TODO: Implement get savings goals
  return c.json({ message: "Not implemented" }, 501);
});

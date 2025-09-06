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
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const budgets = await services.budgetService.getAllBudgets();

  // Filter budgets by user
  const userId = parseInt(user.id);
  const userBudgets = budgets.filter((budget) => budget.userId === userId);

  return c.json(userBudgets, 200);
});

budgetRoutes.openapi(createBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  const budget = await services.budgetService.createBudget({
    ...body,
    userId: parseInt(user.id),
  });

  return c.json(budget, 201);
});

budgetRoutes.openapi(getBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { budgetId } = c.req.valid("param");

  const budget = await services.budgetService.getBudgetById(budgetId);

  if (!budget) {
    return c.json({ message: "Budget not found" }, 404);
  }

  // Check if budget belongs to user
  const userId = parseInt(user.id);
  if (budget.userId !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  return c.json(budget, 200);
});

budgetRoutes.openapi(updateBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { budgetId } = c.req.valid("param");
  const body = c.req.valid("json");

  // First check if budget exists and belongs to user
  const existingBudget = await services.budgetService.getBudgetById(budgetId);
  if (!existingBudget) {
    return c.json({ message: "Budget not found" }, 404);
  }

  const userId = parseInt(user.id);
  if (existingBudget.userId !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const budget = await services.budgetService.updateBudget(budgetId, body);

  if (!budget) {
    return c.json({ message: "Budget not found" }, 404);
  }

  return c.json(budget, 200);
});

budgetRoutes.openapi(deleteBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { budgetId } = c.req.valid("param");

  // First check if budget exists and belongs to user
  const existingBudget = await services.budgetService.getBudgetById(budgetId);
  if (!existingBudget) {
    return c.json({ message: "Budget not found" }, 404);
  }

  const userId = parseInt(user.id);
  if (existingBudget.userId !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const deleted = await services.budgetService.deleteBudget(budgetId);

  if (!deleted) {
    return c.json({ message: "Budget not found" }, 404);
  }

  return c.json({ message: "Budget deleted successfully" }, 200);
});

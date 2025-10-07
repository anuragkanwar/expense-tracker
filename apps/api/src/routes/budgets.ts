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
  const budgets = await services.budgetService.getBudgetsByUser(user.id);

  return c.json(budgets, 200);
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
    userId: user.id,
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

  try {
    const budget = await services.budgetService.getBudgetByIdAndUser(
      user.id,
      budgetId
    );
    return c.json(budget, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

budgetRoutes.openapi(updateBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { budgetId } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const budget = await services.budgetService.updateBudgetByUser(
      user.id,
      budgetId,
      body
    );
    if (!budget) {
      return c.json({ message: "Budget not found" }, 404);
    }
    return c.json(budget, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

budgetRoutes.openapi(deleteBudgetRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { budgetId } = c.req.valid("param");

  try {
    await services.budgetService.deleteBudgetByUser(user.id, budgetId);
    return c.json({ message: "Budget deleted successfully" }, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

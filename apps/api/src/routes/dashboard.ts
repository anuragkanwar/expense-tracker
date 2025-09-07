import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getMonthlySummaryRoute,
  getSpendingByCategoryRoute,
  getUpcomingBillsRoute,
  getNetWorthTrendRoute,
  getSpendingAnalyticsRoute,
} from "./dashboard.contracts";

export const dashboardRoutes = new OpenAPIHono();

dashboardRoutes.openapi(getMonthlySummaryRoute, async (c) => {
  const { dashboardService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Not Authenticated" }, 401);
  }

  try {
    const summary = await dashboardService.getMonthlySummary(user.id);
    return c.json(summary, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

dashboardRoutes.openapi(getSpendingByCategoryRoute, async (c) => {
  const { dashboardService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Not Authenticated" }, 401);
  }

  try {
    const categories = await dashboardService.getSpendingByCategory(user.id);
    return c.json(categories, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

dashboardRoutes.openapi(getUpcomingBillsRoute, async (c) => {
  const { dashboardService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Not Authenticated" }, 401);
  }

  try {
    const query = c.req.valid("query");
    const daysAhead = query.days ? parseInt(query.days) : undefined;
    const bills = await dashboardService.getUpcomingBills(user.id, daysAhead);
    return c.json(bills, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

dashboardRoutes.openapi(getNetWorthTrendRoute, async (c) => {
  const { dashboardService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Not Authenticated" }, 401);
  }

  try {
    const query = c.req.valid("query");
    const months = query.months ? parseInt(query.months) : undefined;
    const trend = await dashboardService.getNetWorthTrend(user.id, months);
    return c.json(trend, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

dashboardRoutes.openapi(getSpendingAnalyticsRoute, async (c) => {
  const { dashboardService } = c.get("services");
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Not Authenticated" }, 401);
  }

  try {
    const analytics = await dashboardService.getSpendingAnalytics(user.id);
    if (!analytics) {
      return c.json(
        {
          totalSpending: 0,
          categories: [],
          analytics: {
            numberOfCategories: 0,
            averageSpendingPerCategory: 0,
            minSpending: 0,
            maxSpending: 0,
            totalTransactions: 0,
            sumOfPercentages: 0,
            standardDeviation: 0,
          },
        },
        200
      );
    }
    return c.json(analytics, 200);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 500);
  }
});

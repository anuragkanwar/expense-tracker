import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getMonthlySummaryRoute,
  getSpendingByCategoryRoute,
  getUpcomingBillsRoute,
  getNetWorthTrendRoute,
} from "./dashboard.contracts";

export const dashboardRoutes = new OpenAPIHono();

dashboardRoutes.openapi(getMonthlySummaryRoute, async (c) => {
  // TODO: Implement get monthly summary
  return c.json({ message: "Not implemented" }, 501);
});

dashboardRoutes.openapi(getSpendingByCategoryRoute, async (c) => {
  // TODO: Implement get spending by category
  return c.json({ message: "Not implemented" }, 501);
});

dashboardRoutes.openapi(getUpcomingBillsRoute, async (c) => {
  // TODO: Implement get upcoming bills
  return c.json({ message: "Not implemented" }, 501);
});

dashboardRoutes.openapi(getNetWorthTrendRoute, async (c) => {
  // TODO: Implement get net worth trend
  return c.json({ message: "Not implemented" }, 501);
});

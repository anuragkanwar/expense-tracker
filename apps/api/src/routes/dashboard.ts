import { OpenAPIHono } from "@hono/zod-openapi";
// import {
//   getMonthlySummaryRoute,
//   getSpendingByCategoryRoute,
//   getUpcomingBillsRoute,
//   getNetWorthTrendRoute,
//   getSpendingAnalyticsRoute,
// } from "./dashboard.contracts";

export const dashboardRoutes = new OpenAPIHono();
//
// dashboardRoutes.openapi(getMonthlySummaryRoute, async (c) => {
//   try {
//     const { dashboardService } = c.get("services");
//     const user = c.get("user");
//
//     if (!user) {
//       return c.json({ message: "Not Authenticated" }, 401);
//     }
//
//     const result = await dashboardService.getMonthlySummary(user);
//     return c.json(result, 200);
//   } catch (error: any) {
//     return c.json({ message: error.message || "Internal server error" }, 500);
//   }
// });
//
// dashboardRoutes.openapi(getSpendingByCategoryRoute, async (c) => {
//   try {
//     const { dashboardService } = c.get("services") as any;
//     const user = c.get("user") as any;
//
//     if (!user) {
//       return c.json({ message: "Not Authenticated" }, 401);
//     }
//
//     const result = await dashboardService.getSpendingByCategory(user);
//     return c.json(result, 200);
//   } catch (error: any) {
//     return c.json({ message: error.message || "Internal server error" }, 500);
//   }
// });
//
// dashboardRoutes.openapi(getUpcomingBillsRoute, async (c) => {
//   try {
//     const { dashboardService } = c.get("services") as any;
//     const user = c.get("user") as any;
//     const query = c.req.valid("query");
//
//     if (!user) {
//       return c.json({ message: "Not Authenticated" }, 401);
//     }
//
//     const days = query.days ? parseInt(query.days) : 30;
//     const result = await dashboardService.getUpcomingBills(user, days);
//     return c.json(result, 200);
//   } catch (error: any) {
//     return c.json({ message: error.message || "Internal server error" }, 500);
//   }
// });
//
// dashboardRoutes.openapi(getNetWorthTrendRoute, async (c) => {
//   try {
//     const { dashboardService } = c.get("services") as any;
//     const user = c.get("user") as any;
//     const query = c.req.valid("query");
//
//     if (!user) {
//       return c.json({ message: "Not Authenticated" }, 401);
//     }
//
//     const months = query.months ? parseInt(query.months) : 12;
//     const result = await dashboardService.getNetWorthTrend(user, months);
//     return c.json(result, 200);
//   } catch (error: any) {
//     return c.json({ message: error.message || "Internal server error" }, 500);
//   }
// });
//
// dashboardRoutes.openapi(getSpendingAnalyticsRoute, async (c) => {
//   try {
//     const { dashboardService } = c.get("services") as any;
//     const user = c.get("user") as any;
//
//     if (!user) {
//       return c.json({ message: "Not Authenticated" }, 401);
//     }
//
//     const result = await dashboardService.getSpendingAnalytics(user);
//     return c.json(result, 200);
//   } catch (error: any) {
//     return c.json({ message: error.message || "Internal server error" }, 500);
//   }
// });

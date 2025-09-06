import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getBalanceSummaryRoute,
  getFriendBalanceRoute,
  getGroupBalanceRoute,
  createSettlementRoute,
  getGlobalSettlementPlanRoute,
  getGroupSettlementPlanRoute,
} from "./balances.contracts";

export const balanceRoutes = new OpenAPIHono();

balanceRoutes.openapi(getBalanceSummaryRoute, async (c) => {
  // TODO: Implement get balance summary
  return c.json({ message: "Not implemented" }, 501);
});

balanceRoutes.openapi(getFriendBalanceRoute, async (c) => {
  // TODO: Implement get friend balance
  return c.json({ message: "Not implemented" }, 501);
});

balanceRoutes.openapi(getGroupBalanceRoute, async (c) => {
  // TODO: Implement get group balance
  return c.json({ message: "Not implemented" }, 501);
});

balanceRoutes.openapi(createSettlementRoute, async (c) => {
  // TODO: Implement create settlement
  return c.json({ message: "Not implemented" }, 501);
});

balanceRoutes.openapi(getGlobalSettlementPlanRoute, async (c) => {
  // TODO: Implement get global settlement plan
  return c.json({ message: "Not implemented" }, 501);
});

balanceRoutes.openapi(getGroupSettlementPlanRoute, async (c) => {
  // TODO: Implement get group settlement plan
  return c.json({ message: "Not implemented" }, 501);
});

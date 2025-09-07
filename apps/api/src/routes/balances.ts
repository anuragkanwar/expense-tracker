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
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { balanceService } = c.get("services");
  const userId = user.id;
  const summary = await balanceService.getBalanceSummary(userId);

  return c.json(summary, 200);
});

balanceRoutes.openapi(getFriendBalanceRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { userId: friendId } = c.req.valid("param");
  const { balanceService } = c.get("services");

  const userId = user.id;
  const numericFriendId = Number(friendId);

  try {
    const balance = await balanceService.getFriendBalance(
      userId,
      numericFriendId
    );
    return c.json(balance, 200);
  } catch {
    return c.json({ message: "Friend not found" }, 404);
  }
});

balanceRoutes.openapi(getGroupBalanceRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { groupId } = c.req.valid("param");
  const { balanceService } = c.get("services");

  const userId = user.id;
  const numericGroupId = Number(groupId);

  try {
    const balance = await balanceService.getGroupBalance(
      userId,
      numericGroupId
    );
    return c.json(balance, 200);
  } catch {
    return c.json({ message: "Group not found" }, 404);
  }
});

balanceRoutes.openapi(createSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const settlementData = c.req.valid("json");
  const { balanceService } = c.get("services");

  try {
    await balanceService.createSettlement(settlementData);
    return c.json({ message: "Settlement recorded successfully" }, 201);
  } catch {
    return c.json({ message: "Failed to record settlement" }, 400);
  }
});

balanceRoutes.openapi(getGlobalSettlementPlanRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { balanceService } = c.get("services");
  const userId = user.id;

  const plan = await balanceService.getGlobalSettlementPlan(userId);
  return c.json(plan, 200);
});

balanceRoutes.openapi(getGroupSettlementPlanRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { groupId } = c.req.valid("param");
  const { balanceService } = c.get("services");

  const userId = user.id;
  const numericGroupId = Number(groupId);

  try {
    const plan = await balanceService.getGroupSettlementPlan(
      userId,
      numericGroupId
    );
    return c.json(plan, 200);
  } catch (error) {
    return c.json({ message: "Group not found" }, 404);
  }
});

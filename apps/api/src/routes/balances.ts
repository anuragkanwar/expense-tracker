import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getBalanceSummaryRoute,
  getFriendBalanceRoute,
  getGroupBalanceRoute,
  createDirectSettlementRoute,
  getGlobalSettlementPlanRoute,
  getGroupSettlementPlanRoute,
} from "./balances.contracts";
import {
  IdempotencyKeyConflictError,
  IdempotencyKeyRequiredError,
} from "../errors/idempotency-errors";

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

  try {
    const balance = await balanceService.getFriendBalance(userId, friendId);
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

  try {
    const balance = await balanceService.getGroupBalance(userId, groupId);
    return c.json(balance, 200);
  } catch {
    return c.json({ message: "Group not found" }, 404);
  }
});

balanceRoutes.openapi(createDirectSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const settlementData = c.req.valid("json");

  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (!idempotencyKey) {
      const err = new IdempotencyKeyRequiredError();
      return c.json(err.toJSON(), 400);
    }
    const services = c.get("services");
    try {
      const { settlement, replay } =
        await services.settlementService.createDirectSettlement({
          payerId: user.id,
          payeeId: settlementData.payeeId,
          amount: settlementData.amount,
          currency: settlementData.currency,
          groupId: settlementData.groupId ?? null,
          idempotencyKey,
        });
      return c.json(settlement, replay ? 200 : 201);
    } catch (error: any) {
      if (error instanceof IdempotencyKeyConflictError) {
        return c.json(error.toJSON(), 409 as any);
      }
      return c.json(
        error.toJSON
          ? error.toJSON()
          : { message: error.message || "Failed to record settlement" },
        error.statusCode || 400
      );
    }
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

  try {
    const plan = await balanceService.getGroupSettlementPlan(userId, groupId);
    return c.json(plan, 200);
  } catch (error) {
    return c.json({ message: "Group not found" }, 404);
  }
});

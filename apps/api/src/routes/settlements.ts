import { OpenAPIHono } from "@hono/zod-openapi";
import { allocateExpenseShareSettlementRoute } from "./settlements.contracts";

export const settlementRoutes = new OpenAPIHono();

settlementRoutes.openapi(allocateExpenseShareSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const services = c.get("services");
  const body = c.req.valid("json");
  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (!idempotencyKey) {
      return c.json({ message: "Idempotency-Key header required" }, 400);
    }
    const result =
      await services.settlementService.allocateExpenseShareSettlement({
        payerId: user.id, // authenticated user paying back
        payeeId: body.payeeId,
        amount: body.amount,
        currency: body.currency,
        groupId: body.groupId ?? null,
        idempotencyKey,
      });
    return c.json(result, 200);
  } catch (error: any) {
    return c.json(
      { message: error.message || "Failed to allocate settlement" },
      400
    );
  }
});

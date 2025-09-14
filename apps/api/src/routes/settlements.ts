import { OpenAPIHono } from "@hono/zod-openapi";
import { allocateExpenseShareSettlementRoute } from "./settlements.contracts";
import { IdempotencyKeyRequiredError } from "../errors/idempotency-errors";
import { handleRouteError } from "@/utils/error-response-handler";

export const settlementRoutes = new OpenAPIHono();

settlementRoutes.openapi(allocateExpenseShareSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(
      new (class extends Error {
        constructor() {
          super("Unauthorized");
        }
      })()
    );
    return c.json(json, status);
  }
  const services = c.get("services");
  const body = c.req.valid("json");
  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (!idempotencyKey) {
      const err = new IdempotencyKeyRequiredError();
      const { json, status } = handleRouteError(err);
      return c.json(json, status);
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
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

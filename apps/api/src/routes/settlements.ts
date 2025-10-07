import { OpenAPIHono } from "@hono/zod-openapi";
import {
  allocateUnifiedSettlementRoute,
  allocateExpenseSettlementRoute,
  allocateLoanSettlementRoute,
  getSettlementByIdRoute,
} from "./settlements.contracts";
import { IdempotencyKeyRequiredError } from "../errors/idempotency-errors";
import { handleRouteError } from "@/utils/error-response-handler";
import { BadRequestError } from "@/errors/base-error";

export const settlementRoutes = new OpenAPIHono();

// Handle settlement allocation (both expense shares and loans)
settlementRoutes.openapi(allocateUnifiedSettlementRoute, async (c) => {
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
    const result = await services.settlementService.allocateSettlement({
      payerId: user.id, // authenticated user paying back
      payeeId: body.payeeId,
      amount: body.amount,
      currency: body.currency,
      groupId: body.groupId ?? null,
      idempotencyKey,
      type: body.type ?? null,
    });
    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

// Handle expense share only allocation
settlementRoutes.openapi(allocateExpenseSettlementRoute, async (c) => {
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

// Handle loan only allocation
settlementRoutes.openapi(allocateLoanSettlementRoute, async (c) => {
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
    const result = await services.settlementService.allocateLoanSettlement({
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

// Get settlement by ID
settlementRoutes.openapi(getSettlementByIdRoute, async (c) => {
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
  const { id } = c.req.valid("param");

  try {
    const settlement = await services.settlementService.getSettlementById(id);
    if (!settlement) {
      throw new BadRequestError("Settlement not found");
    }

    // TODO: Add authorization check to verify user is either payer or payee
    // if (settlement.payerId !== user.id && settlement.payeeId !== user.id) {
    //   throw new BadRequestError("Not authorized to view this settlement");
    // }

    return c.json(settlement, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

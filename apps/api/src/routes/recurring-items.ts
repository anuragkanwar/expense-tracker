import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getRecurringItemsRoute,
  createRecurringItemRoute,
  getRecurringItemRoute,
  updateRecurringItemRoute,
  deleteRecurringItemRoute,
} from "./recurring-items.contracts";
import { RECURRENCE_TYPE, TIME_PERIOD, ACCOUNT_TYPE } from "@/db/constants";
import { handleRouteError } from "@/utils/error-response-handler";

const periodMap: Record<string, TIME_PERIOD> = {
  monthly: TIME_PERIOD.MONTHLY,
  weekly: TIME_PERIOD.WEEKLY,
  yearly: TIME_PERIOD.YEARLY,
};

export const recurringItemRoutes = new OpenAPIHono();

recurringItemRoutes.openapi(getRecurringItemsRoute, async (c) => {
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
  try {
    const recurringItems =
      await services.recurringService.getRecurringItemsByUserId(user.id);
    return c.json(recurringItems, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

recurringItemRoutes.openapi(createRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Unauthorized"));
    return c.json(json, status);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  const recurrenceType =
    body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT;

  // Partial recurring creation data prior to account resolution
  const recurringData = {
    description: body.description as string,
    amount: body.amount as number,
    period: periodMap[body.period] || TIME_PERIOD.MONTHLY,
    type: recurrenceType,
    nextDate: body.nextDate as string | undefined,
  } as const;

  try {
    const recurringItem =
      await services.recurringService.createRecurringItemWithResolution(
        user.id,
        recurringData,
        recurrenceType,
        body.categoryId,
        body.type === "expense" ? ACCOUNT_TYPE.EXPENSE : undefined
      );
    return c.json(recurringItem, 201);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

recurringItemRoutes.openapi(getRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Unauthorized"));
    return c.json(json, status);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");

  try {
    const recurringItem =
      await services.recurringService.getRecurringItemByIdAndUser(
        user.id,
        itemId
      );
    return c.json(recurringItem, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

recurringItemRoutes.openapi(updateRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Unauthorized"));
    return c.json(json, status);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");
  const body = c.req.valid("json");

  const recurrenceType =
    body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT;

  const recurringData = {
    description: body.description,
    amount: body.amount,
    period: body.period
      ? periodMap[body.period] || TIME_PERIOD.MONTHLY
      : TIME_PERIOD.MONTHLY,
    type: recurrenceType,
    nextDate: body.nextDate,
  };

  try {
    const updatedItem =
      await services.recurringService.updateRecurringItemWithResolution(
        user.id,
        itemId,
        recurringData,
        recurrenceType,
        body.categoryId,
        body.type === "expense" ? ACCOUNT_TYPE.EXPENSE : undefined
      );

    if (!updatedItem) {
      const { json, status } = handleRouteError(
        new Error("Recurring item not found")
      );
      return c.json(json, status);
    }

    return c.json(updatedItem, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

recurringItemRoutes.openapi(deleteRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    const { json, status } = handleRouteError(new Error("Unauthorized"));
    return c.json(json, status);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");

  try {
    await services.recurringService.deleteRecurringItemByUser(user.id, itemId);
    return c.json({ message: "Recurring item deleted successfully" }, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

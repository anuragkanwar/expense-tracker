import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getRecurringItemsRoute,
  createRecurringItemRoute,
  getRecurringItemRoute,
  updateRecurringItemRoute,
  deleteRecurringItemRoute,
} from "./recurring-items.contracts";
import { RECURRENCE_TYPE, TIME_PERIOD, ACCOUNT_TYPE } from "@/db/constants";

const periodMap: Record<string, TIME_PERIOD> = {
  monthly: TIME_PERIOD.MONTHLY,
  weekly: TIME_PERIOD.WEEKLY,
  yearly: TIME_PERIOD.YEARLY,
};

export const recurringItemRoutes = new OpenAPIHono();

recurringItemRoutes.openapi(getRecurringItemsRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const recurringItems =
    await services.recurringService.getRecurringItemsByUserId(user.id);

  return c.json(recurringItems, 200);
});

recurringItemRoutes.openapi(createRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  // Determine recurrence type
  const recurrenceType =
    body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT;

  // Map DTO to model
  const recurringData = {
    description: body.description,
    amount: body.amount,
    period: periodMap[body.period] || TIME_PERIOD.MONTHLY,
    type: recurrenceType,
    nextDate: body.nextDate,
  };

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
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

recurringItemRoutes.openapi(getRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
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
  } catch (error: any) {
    if (error.message === "Recurring item not found") {
      return c.json({ message: "Recurring item not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: "Internal server error" }, 500);
  }
});

recurringItemRoutes.openapi(updateRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");
  const body = c.req.valid("json");

  // Determine recurrence type
  const recurrenceType =
    body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT;

  // Map DTO to model
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
      return c.json({ message: "Recurring item not found" }, 404);
    }

    return c.json(updatedItem, 200);
  } catch (error: any) {
    if (error.message === "Recurring item not found") {
      return c.json({ message: "Recurring item not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

recurringItemRoutes.openapi(deleteRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");

  try {
    await services.recurringService.deleteRecurringItemByUser(user.id, itemId);
    return c.json({ message: "Recurring item deleted successfully" }, 200);
  } catch (error: any) {
    if (error.message === "Recurring item not found") {
      return c.json({ message: "Recurring item not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: "Internal server error" }, 500);
  }
});

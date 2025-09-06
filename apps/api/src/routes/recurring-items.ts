import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getRecurringItemsRoute,
  createRecurringItemRoute,
  getRecurringItemRoute,
  updateRecurringItemRoute,
  deleteRecurringItemRoute,
} from "./recurring-items.contracts";
import { RECURRENCE_TYPE, TIME_PERIOD } from "@/db/constants";

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
  const recurringItems = await services.recurringService.getAllRecurringItems();

  // Filter recurring items by user
  const userId = parseInt(user.id);
  const userRecurringItems = recurringItems.filter(
    (item) => item.userId === userId
  );

  return c.json(userRecurringItems, 200);
});

recurringItemRoutes.openapi(createRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  // Map DTO to model - need to convert type and handle account mappings
  const recurringData = {
    description: body.description,
    amount: body.amount,
    period: periodMap[body.period] || TIME_PERIOD.MONTHLY,
    type:
      body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT,
    userId: parseInt(user.id),
    sourceTransactionAccountID: 1, // TODO: Map from accountId
    targetTransactionAccountID: 1, // TODO: Map from accountId
    nextDate: body.nextDate,
  } as any;

  const recurringItem =
    await services.recurringService.createRecurringItem(recurringData);

  return c.json(recurringItem, 201);
});

recurringItemRoutes.openapi(deleteRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");

  // First check if recurring item exists and belongs to user
  const existingItem =
    await services.recurringService.getRecurringItemById(itemId);
  if (!existingItem) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  const userId = parseInt(user.id);
  if (existingItem.userId !== userId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const deleted = await services.recurringService.deleteRecurringItem(itemId);

  if (!deleted) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  return c.json({ message: "Recurring item deleted successfully" }, 200);
});

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

// Helper function to resolve accounts for recurring items
async function resolveAccountsForRecurringItem(
  services: any,
  userId: number,
  recurrenceType: RECURRENCE_TYPE,
  categoryName?: string,
  accountType?: string
): Promise<{ sourceAccountId: number; targetAccountId: number }> {
  const resolvedAccounts =
    await services.recurringService.resolveAccountsForRecurringItem(
      userId,
      recurrenceType,
      categoryName,
      accountType as any
    );

  // Validate that the resolved accounts exist and belong to the user
  await services.recurringService.validateResolvedAccounts(
    userId,
    resolvedAccounts
  );

  return resolvedAccounts;
}

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

  // Resolve appropriate accounts for this recurring item
  const { sourceAccountId: srcAccId, targetAccountId: tgtAccId } =
    await resolveAccountsForRecurringItem(
      services,
      user.id,
      recurrenceType,
      body.categoryId, // Optional category for account resolution
      body.type === "expense" ? "EXPENSE" : undefined // Account type for DEBIT transactions
    );

  // Map DTO to model - need to convert type and handle account mappings
  const recurringData = {
    description: body.description,
    amount: body.amount,
    period: periodMap[body.period] || TIME_PERIOD.MONTHLY,
    type: recurrenceType,
    userId: user.id,
    sourceTransactionAccountID: srcAccId,
    targetTransactionAccountID: tgtAccId,
    nextDate: body.nextDate,
  } as any;

  const recurringItem =
    await services.recurringService.createRecurringItem(recurringData);

  return c.json(recurringItem, 201);
});

recurringItemRoutes.openapi(getRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");

  const recurringItem =
    await services.recurringService.getRecurringItemById(itemId);

  if (!recurringItem) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  if (recurringItem.userId !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  return c.json(recurringItem, 200);
});

recurringItemRoutes.openapi(updateRecurringItemRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { itemId } = c.req.valid("param");
  const body = c.req.valid("json");

  // First check if recurring item exists and belongs to user
  const existingItem =
    await services.recurringService.getRecurringItemById(itemId);
  if (!existingItem) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  if (existingItem.userId !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  // Determine recurrence type
  const recurrenceType =
    body.type === "income" ? RECURRENCE_TYPE.CREDIT : RECURRENCE_TYPE.DEBIT;

  // Resolve appropriate accounts for this recurring item
  const { sourceAccountId: srcAccId, targetAccountId: tgtAccId } =
    await resolveAccountsForRecurringItem(
      services,
      user.id,
      recurrenceType,
      body.categoryId, // Optional category for account resolution
      body.type === "expense" ? "EXPENSE" : undefined // Account type for DEBIT transactions
    );

  // Map DTO to model - need to convert type and handle account mappings
  const recurringData = {
    description: body.description,
    amount: body.amount,
    period: body.period
      ? periodMap[body.period] || TIME_PERIOD.MONTHLY
      : TIME_PERIOD.MONTHLY,
    type: recurrenceType,
    sourceTransactionAccountID: srcAccId,
    targetTransactionAccountID: tgtAccId,
    nextDate: body.nextDate,
  } as any;

  const updatedItem = await services.recurringService.updateRecurringItem(
    itemId,
    recurringData
  );

  if (!updatedItem) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  return c.json(updatedItem, 200);
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

  if (existingItem.userId !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const deleted = await services.recurringService.deleteRecurringItem(itemId);

  if (!deleted) {
    return c.json({ message: "Recurring item not found" }, 404);
  }

  return c.json({ message: "Recurring item deleted successfully" }, 200);
});

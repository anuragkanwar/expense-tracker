import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createExpenseRoute,
  getExpensesRoute,
  getExpenseRoute,
  getGroupExpensesRoute,
  getFriendExpensesRoute,
  updateExpenseRoute,
  deleteExpenseRoute,
  createExpenseWithAIRoute,
} from "./expenses.contracts";

import { ExpenseCreateWithDetails } from "@/dto/expenses.dto";

export const expenseRoutes = new OpenAPIHono();

expenseRoutes.openapi(createExpenseRoute, async (c) => {
  // TODO: Implement create expense
  try {
    const data = c.req.valid("json") as ExpenseCreateWithDetails;
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not Authenticated" }, 401);
    }
    expenseService.createExpense(data, user);
  } catch (error: any) {
    return c.json({ message: error }, 400);
  }
  return c.json({ message: "success" }, 200);
});

expenseRoutes.openapi(getExpensesRoute, async (c) => {
  // TODO: Implement get user expenses
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(getExpenseRoute, async (c) => {
  // TODO: Implement get expense details
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(getGroupExpensesRoute, async (c) => {
  // TODO: Implement get group expenses
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(getFriendExpensesRoute, async (c) => {
  // TODO: Implement get friend expenses
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(updateExpenseRoute, async (c) => {
  // TODO: Implement update expense
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(deleteExpenseRoute, async (c) => {
  // TODO: Implement delete expense
  return c.json({ message: "Not implemented" }, 501);
});

expenseRoutes.openapi(createExpenseWithAIRoute, async (c) => {
  // TODO: Implement create expense with AI
  // 1. Get the AI prompt from request body
  // 2. Process the prompt with AI/LLM to extract structured expense data
  // 3. Validate the parsed data
  // 4. Create the expense using the parsed ExpenseCreateWithDetailsSchema
  // 5. Return the created expense with details

  const body = c.req.valid("json");
  const { userPrompt, groupIds, userIds } = body;

  // Placeholder for AI processing
  // const parsedExpense = await aiService.parseExpensePrompt(userPrompt, groupIds, userIds);

  // Placeholder response - replace with actual implementation
  return c.json(
    {
      message: "AI expense creation not yet implemented",
      receivedPrompt: userPrompt,
      groupIds,
      userIds,
    },
    501
  );
});

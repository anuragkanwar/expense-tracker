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
  try {
    const data = c.req.valid("json") as ExpenseCreateWithDetails;
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    // For now, we'll return a placeholder response since createExpense doesn't return data
    // In a full implementation, createExpense should return the created expense
    await expenseService.createExpense(data);

    return c.json(
      {
        message: "Expense created successfully",
        // TODO: Return the created expense data when createExpense method is updated
      },
      201
    );
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("Validation")) {
      return c.json({ message: error.message }, 400);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(getExpensesRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { page, limit, type } = c.req.valid("query");

    const result = await expenseService.getExpenses(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type || undefined,
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(getExpenseRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { expenseId } = c.req.valid("param");

    const expense = await expenseService.getExpenseById(
      Number(expenseId),
      user.id
    );

    return c.json(expense, 200);
  } catch (error: any) {
    if (error.message === "Expense not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(getGroupExpensesRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { groupId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await expenseService.getGroupExpenses(
      Number(groupId),
      user.id,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }
    );

    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === "Group not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(getFriendExpensesRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { userId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await expenseService.getFriendExpenses(
      Number(userId),
      user.id,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }
    );

    return c.json(result, 200);
  } catch (error: any) {
    if (error.message.includes("friends")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(updateExpenseRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { expenseId } = c.req.valid("param");
    const updateData = c.req.valid("json");

    const updatedExpense = await expenseService.updateExpense(
      Number(expenseId),
      user.id,
      updateData
    );

    return c.json(updatedExpense, 200);
  } catch (error: any) {
    if (error.message === "Expense not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

expenseRoutes.openapi(deleteExpenseRoute, async (c) => {
  try {
    const { expenseService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { expenseId } = c.req.valid("param");

    const result = await expenseService.deleteExpense(
      Number(expenseId),
      user.id
    );

    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === "Expense not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

// NOTE: DO NOT IMPLEMENT THIS, THIS IS JUST FUTURE NOT IMPLEMENT NOW
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

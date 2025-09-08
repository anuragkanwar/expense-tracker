import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createTransactionRoute,
  getTransactionsRoute,
  getTransactionRoute,
  getGroupTransactionsRoute,
  getFriendTransactionsRoute,
  updateTransactionRoute,
  deleteTransactionRoute,
  createTransactionWithAIRoute,
} from "./transactions.contracts";

import { TransactionCreateWithDetails } from "@/dto/transactions.dto";
import { requireAuthMiddleware } from "@/middleware/require-auth-middleware";
import { handleRouteError } from "@/utils/error-response-handler";

export const transactionRoutesExport = new OpenAPIHono();

transactionRoutesExport.use(requireAuthMiddleware());

transactionRoutesExport.openapi(createTransactionRoute, async (c) => {
  try {
    const data = c.req.valid("json") as TransactionCreateWithDetails;
    const { transactionService } = c.get("services");

    await transactionService.createTransaction(data);

    return c.json(
      {
        message: "Transaction created successfully",
      },
      201
    );
  } catch (error: any) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status as any);
  }
});

transactionRoutesExport.openapi(getTransactionsRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { page, limit, type } = c.req.valid("query");

    const result = await transactionService.getTransactions(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type || undefined,
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

transactionRoutesExport.openapi(getTransactionRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { transactionId } = c.req.valid("param");

    const transaction = await transactionService.getTransactionById(
      Number(transactionId),
      user.id
    );

    return c.json(transaction, 200);
  } catch (error: any) {
    if (error.message === "Transaction not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

transactionRoutesExport.openapi(getGroupTransactionsRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { groupId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await transactionService.getGroupTransactions(
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

transactionRoutesExport.openapi(getFriendTransactionsRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { userId } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const result = await transactionService.getFriendTransactions(
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

transactionRoutesExport.openapi(updateTransactionRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { transactionId } = c.req.valid("param");
    const updateData = c.req.valid("json");

    const updatedTransaction = await transactionService.updateTransaction(
      Number(transactionId),
      user.id,
      updateData
    );

    return c.json(updatedTransaction, 200);
  } catch (error: any) {
    if (error.message === "Transaction not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

transactionRoutesExport.openapi(deleteTransactionRoute, async (c) => {
  try {
    const { transactionService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }

    const { transactionId } = c.req.valid("param");

    const result = await transactionService.deleteTransaction(
      Number(transactionId),
      user.id
    );

    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === "Transaction not found") {
      return c.json({ message: error.message }, 404);
    }
    if (error.message.includes("access")) {
      return c.json({ message: error.message }, 403);
    }
    return c.json({ message: error.message || "Internal server error" }, 500);
  }
});

// NOTE: DO NOT IMPLEMENT THIS, THIS IS JUST FUTURE NOT IMPLEMENT NOW
transactionRoutesExport.openapi(createTransactionWithAIRoute, async (c) => {
  // TODO: Implement create transaction with AI
  // 1. Get the AI prompt from request body
  // 2. Process the prompt with AI/LLM to extract structured transaction data
  // 3. Validate the parsed data
  // 4. Create the transaction using the parsed TransactionCreateWithDetailsSchema
  // 5. Return the created transaction with details

  const body = c.req.valid("json");
  const { userPrompt, groupIds, userIds } = body;

  // Placeholder for AI processing
  // const parsedTransaction = await aiService.parseTransactionPrompt(userPrompt, groupIds, userIds);

  // Placeholder response - replace with actual implementation
  return c.json(
    {
      message: "AI transaction creation not yet implemented",
      receivedPrompt: userPrompt,
      groupIds,
      userIds,
    },
    501
  );
});

// Export is already declared above

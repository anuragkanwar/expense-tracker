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

import type {
  TransactionCreateWithDetails,
  TransactionUpdateWithDetails,
} from "@pocket-pixie/contracts";
import { requireAuthMiddleware } from "@/middleware/require-auth-middleware";
import { handleRouteError } from "@/utils/error-response-handler";

export const transactionRoutesExport = new OpenAPIHono();

transactionRoutesExport.use(requireAuthMiddleware());

transactionRoutesExport.openapi(createTransactionRoute, async (c) => {
  try {
    const data: TransactionCreateWithDetails = c.req.valid("json");
    const { transactionService } = c.get("services");
    const user = c.get("user");

    await transactionService.createTransaction(data, user?.currency || "INR");

    return c.json(
      {
        message: "Transaction created successfully",
      },
      201
    );
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
      page,
      limit,
      type: type || undefined,
    });

    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
      transactionId,
      user.id
    );

    return c.json(transaction, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
      groupId,
      user.id,
      {
        page,
        limit,
      }
    );

    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
      userId,
      user.id,
      {
        page,
        limit,
      }
    );

    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
    const updateData: TransactionUpdateWithDetails = c.req.valid("json");

    const updatedTransaction = await transactionService.updateTransaction(
      transactionId,
      user.id,
      updateData
    );

    return c.json(updatedTransaction, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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
      transactionId,
      user.id
    );

    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
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

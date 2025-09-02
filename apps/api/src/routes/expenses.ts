import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createExpenseRoute,
  getExpensesRoute,
  getExpenseRoute,
  getGroupExpensesRoute,
  getFriendExpensesRoute,
  updateExpenseRoute,
  deleteExpenseRoute,
} from "./expenses.contracts";

export const expenseRoutes = new OpenAPIHono();

expenseRoutes.openapi(createExpenseRoute, async (c) => {
  // TODO: Implement create expense
  return c.json({ message: "Not implemented" }, 501);
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

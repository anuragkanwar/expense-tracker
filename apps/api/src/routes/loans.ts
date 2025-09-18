import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createLoanSymmetricRoute,
  getLoansRoute,
  getLoanRoute,
  updateLoanRoute,
  deleteLoanRoute,
} from "./loans.contracts";
import { requireAuthMiddleware } from "@/middleware/require-auth-middleware";
import { handleRouteError } from "@/utils/error-response-handler";

/**
 * This is the standard implementation of loan routes that uses the LoanService.
 * The API contracts remain the same, and the underlying implementation uses
 * the unified expense_share schema.
 */
export const loanRoutes = new OpenAPIHono();

loanRoutes.use(requireAuthMiddleware());

// Standard loan routes
loanRoutes.openapi(createLoanSymmetricRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const body = c.req.valid("json");
    const { loanService } = c.get("services");
    const created = await loanService.createDirectLoanSymmetric(body, user.id);
    return c.json(created, 201);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

loanRoutes.openapi(getLoansRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const query = c.req.valid("query");
    const { loanService } = c.get("services");
    const { page, limit, type } = query;
    const result = await loanService.getLoans(user.id, {
      page,
      limit,
      type,
    });
    return c.json(result, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

loanRoutes.openapi(getLoanRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const { loanId } = c.req.valid("param");
    const { loanService } = c.get("services");
    const loan = await loanService.getLoanById(loanId, user.id);
    return c.json(loan, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

loanRoutes.openapi(updateLoanRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const { loanId } = c.req.valid("param");
    const body = c.req.valid("json");
    const { loanService } = c.get("services");
    const loan = await loanService.updateLoan(loanId, user.id, body);
    return c.json(loan, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

loanRoutes.openapi(deleteLoanRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const { loanId } = c.req.valid("param");
    const { loanService } = c.get("services");
    const resp = await loanService.deleteLoan(loanId, user.id);
    return c.json(resp, 200);
  } catch (error: unknown) {
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

// Group loan routes moved to groups.ts to maintain proper API organization

// Friend loan routes moved to friends.ts to maintain proper API organization

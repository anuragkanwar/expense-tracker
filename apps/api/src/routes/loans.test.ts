import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { loanRoutes } from "./loans";
// (Using inline error handling to avoid alias resolution issues in test build)
// Local enum replicas to keep test decoupled from path alias resolution
const SHARE_TYPE = { FRIENDS: "FRIENDS", GROUP: "GROUP" } as const;
const TXN_TYPE = { LOAN_GIVEN: "LOAN_GIVEN" } as const;

// Provide minimal typing augmentation for Context.set to silence TS (test env)
declare module "hono" {
  interface ContextVariableMap {
    user: any;
    services: any;
  }
}

// Minimal route-level integration test with manual DI mock.

describe("POST /api/v1/loans - route integration", () => {
  let app: OpenAPIHono;
  let mockLoanService: { createLoan: any };
  const mockUser = { id: 10 } as any;

  beforeEach(() => {
    app = new OpenAPIHono();
    mockLoanService = { createLoan: vi.fn() } as any;

    app.use("*", async (c, next) => {
      c.set("user", mockUser as any);
      c.set("services", { loanService: mockLoanService } as any);
      try {
        await next();
      } catch (err) {
        const status = (err as any)?.statusCode || (err as any)?.status || 400;
        const json = (err as any)?.toJSON
          ? (err as any).toJSON()
          : {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: (err as any)?.message || "Validation error",
              },
            };
        return c.json(json, status as any);
      }
    });

    app.route("/api/v1/loans", loanRoutes);
  });

  it("returns 201 and created loan payload on success", async () => {
    const createdLoan = {
      id: 555,
      amount: 200,
      createdBy: mockUser.id,
      currency: "USD",
      description: "Test loan",
      groupId: null,
      transactionId: 999,
    };
    mockLoanService.createLoan.mockResolvedValue(createdLoan);

    const res = await app.request("/api/v1/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Test loan",
        amount: 200,
        currency: "USD",
        sourceTransactionAccountID: 101,
        targetTransactionAccountID: 202,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL",
        splits: [{ userId: 11, amountOwed: 200 }],
        type: TXN_TYPE.LOAN_GIVEN, // router sets payer and enforces LOAN_GIVEN
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject(createdLoan);
    expect(mockLoanService.createLoan).toHaveBeenCalledTimes(1);
    const payload = mockLoanService.createLoan.mock.calls[0][0];
    expect(payload.payer).toBe(mockUser.id);
  });

  it("propagates service validation errors with 400", async () => {
    const validationError: any = new Error(
      "Split amount must match the transaction amount for loan transactions"
    );
    validationError.statusCode = 400;
    validationError.toJSON = () => ({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validationError.message,
      },
    });
    // ensure our catch block sees statusCode
    (validationError as any).status = 400;
    mockLoanService.createLoan.mockRejectedValue(validationError);
    // Also set a .message starting with 'Validation' to trigger 400 mapping
    validationError.message = "Validation: " + validationError.message;

    const res = await app.request("/api/v1/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Mismatch loan",
        amount: 200,
        currency: "USD",
        sourceTransactionAccountID: 101,
        targetTransactionAccountID: 202,
        sharedWith: SHARE_TYPE.FRIENDS,
        splitType: "EQUAL",
        splits: [{ userId: 11, amountOwed: 150 }],
        type: TXN_TYPE.LOAN_GIVEN, // router sets payer and enforces LOAN_GIVEN
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message || json.message).toMatch(
      /Split amount must match/i
    );
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { ValidationError } from "../errors/base-error";
import { loanRoutes } from "./loans";

// Local enum replicas (avoid path alias dependency)
const ACCOUNT_TYPE = {
  LOAN_GIVEN: "LOAN_GIVEN",
  LOAN_TAKEN: "LOAN_TAKEN",
} as const;

// Type augmentation for test context variables
declare module "hono" {
  interface ContextVariableMap {
    user: any;
    services: any;
  }
}

describe("POST /api/v1/loans/symmetric - route integration", () => {
  let app: OpenAPIHono;
  const mockUser = { id: 100 } as any; // authenticated creditor

  // Mocks
  let mockLoanService: any;

  beforeEach(() => {
    app = new OpenAPIHono();
    mockLoanService = {
      createDirectLoanSymmetric: vi.fn(),
    };

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

  it("returns 201 with created symmetric loan (friend context)", async () => {
    const createdLoan = {
      id: 501,
      creditorId: mockUser.id,
      debtorId: 200,
      amount: 75,
      currency: "USD",
      description: "Lunch",
      groupId: null,
      transactionId: 9001,
    };
    mockLoanService.createDirectLoanSymmetric.mockResolvedValue(createdLoan);

    const res = await app.request("/api/v1/loans/symmetric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debtorId: 200,
        amount: 75,
        currency: "USD",
        description: "Lunch",
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject(createdLoan);
    expect(mockLoanService.createDirectLoanSymmetric).toHaveBeenCalledWith(
      { debtorId: 200, amount: 75, currency: "USD", description: "Lunch" },
      mockUser.id
    );
    // No deprecation headers (legacy route removed)
    expect(res.headers.get("Deprecation")).toBeNull();
  });

  it("normalizes missing description to empty string in service output", async () => {
    const createdLoan = {
      id: 777,
      creditorId: mockUser.id,
      debtorId: 300,
      amount: 40,
      currency: "USD",
      description: "", // normalized
      groupId: null,
      transactionId: 9100,
    };
    mockLoanService.createDirectLoanSymmetric.mockResolvedValue(createdLoan);

    const res = await app.request("/api/v1/loans/symmetric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtorId: 300, amount: 40, currency: "USD" }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.description).toBe("");
  });

  it("propagates validation error (self-loan) as 400", async () => {
    const error: any = new Error("Creditor and debtor must be different users");
    error.statusCode = 400;
    error.status = 400;
    error.toJSON = () => ({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    mockLoanService.createDirectLoanSymmetric.mockRejectedValue(error);

    const res = await app.request("/api/v1/loans/symmetric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debtorId: mockUser.id,
        amount: 10,
        currency: "USD",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/must be different/i);
  });

  it("propagates validation error (non-positive amount) as 400", async () => {
    const error: any = new Error("Amount must be > 0");
    error.statusCode = 400;
    error.status = 400;
    error.toJSON = () => ({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    mockLoanService.createDirectLoanSymmetric.mockRejectedValue(error);

    const res = await app.request("/api/v1/loans/symmetric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtorId: 300, amount: 0, currency: "USD" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/Amount must be > 0/);
  });

  it("propagates validation error (invalid currency length) as 400", async () => {
    const error: any = new Error("Currency must be a 3-letter ISO code");
    error.statusCode = 400;
    error.status = 400;
    error.toJSON = () => ({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message },
    });
    mockLoanService.createDirectLoanSymmetric.mockRejectedValue(error);

    const res = await app.request("/api/v1/loans/symmetric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtorId: 200, amount: 10, currency: "US" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/3-letter/);
  });
});

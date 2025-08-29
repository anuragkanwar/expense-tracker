import { describe, it, expect } from "vitest";
import app from "./index";

describe("Pocket Pixie API", () => {
  it("should return health check on root", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      message: string;
      version: string;
      timestamp: string;
    };
    expect(body.success).toBe(true);
    expect(body.message).toBe("Pocket Pixie API is running!");
    expect(body.version).toBe("1.0.0");
    expect(body.timestamp).toBeDefined();
  });

  it("should return empty students array initially", async () => {
    const res = await app.request("/students");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: any[];
      pagination: any;
    };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toBeDefined();
  });

  it("should return 404 for unknown routes", async () => {
    const res = await app.request("/unknown-route");
    expect(res.status).toBe(404);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 404 for non-existent student", async () => {
    const res = await app.request("/students/non-existent-id");
    expect(res.status).toBe(404);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

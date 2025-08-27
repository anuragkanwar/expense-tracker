
import { describe, it, expect } from "vitest";
import app from "./index.js";

describe("Hono API", () => {
  it("should return hello message on root", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.message).toBe("Hello Pocket Pixie!");
  });
});

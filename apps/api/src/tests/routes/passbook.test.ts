import { createClient } from "hono/testing";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { passbookRoutes } from "../../routes/passbook";

// Mock dependencies
vi.mock("@/services/passbook-service", () => {
  return {
    PassbookService: vi.fn().mockImplementation(() => ({
      getPassbookEntries: vi.fn().mockResolvedValue({
        entries: [],
        total: 0,
        page: 1,
        limit: 20,
      }),
    })),
  };
});

describe("Passbook Routes", () => {
  const app = passbookRoutes;
  const client = createClient(app);

  // Mock user middleware
  app.use("*", async (c, next) => {
    c.set("user", { id: 1, name: "Test User" });
    c.set("services", {
      passbookService: {
        getPassbookEntries: vi.fn().mockResolvedValue({
          entries: [],
          total: 0,
          page: 1,
          limit: 20,
        }),
      },
    });
    await next();
  });

  describe("GET /passbook", () => {
    it("should return 200 with default parameters", async () => {
      const res = await client.get("/passbook");
      expect(res.status).toBe(200);
    });

    it("should pass query parameters to service", async () => {
      const spy = vi.spyOn(
        app.get("services").passbookService,
        "getPassbookEntries"
      );

      await client.get(
        "/passbook?page=2&limit=10&startDate=2025-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z&categoryId=123&accountId=456&entryType=expense&status=unpaid"
      );

      expect(spy).toHaveBeenCalledWith(
        1, // userId
        2, // page
        10, // limit
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          categoryId: 123,
          accountId: 456,
          entryType: "expense",
          status: "unpaid",
        })
      );
    });
  });
});

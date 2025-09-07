import { OpenAPIHono } from "@hono/zod-openapi";
import { getPassbookRoute } from "./passbook.contracts";
import { PassbookService } from "@/services/passbook-service";
import { PassbookFilters } from "@/repositories/passbook-repository";

export const passbookRoutes = new OpenAPIHono();

passbookRoutes.openapi(getPassbookRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const passbookService = services.passbookService as PassbookService;

  try {
    // Parse query parameters
    const query = c.req.valid("query");

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;

    // Build filters
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.categoryId) {
      filters.categoryId = query.categoryId;
    }

    if (query.accountId) {
      filters.accountId = query.accountId;
    }

    // Get passbook entries
    const result = await passbookService.getPassbookEntries(
      user.id,
      page,
      limit,
      filters
    );

    return c.json(result, 200);
  } catch (error: any) {
    console.error("Passbook route error:", error);
    return c.json(
      { message: error.message || "Failed to retrieve passbook entries" },
      500
    );
  }
});

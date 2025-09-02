import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getCategoriesRoute,
  createCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute,
} from "./categories.contracts";

export const categoryRoutes = new OpenAPIHono();

categoryRoutes.openapi(getCategoriesRoute, async (c) => {
  // TODO: Implement get categories
  return c.json({ message: "Not implemented" }, 501);
});

categoryRoutes.openapi(createCategoryRoute, async (c) => {
  // TODO: Implement create category
  return c.json({ message: "Not implemented" }, 501);
});

categoryRoutes.openapi(updateCategoryRoute, async (c) => {
  // TODO: Implement update category
  return c.json({ message: "Not implemented" }, 501);
});

categoryRoutes.openapi(deleteCategoryRoute, async (c) => {
  // TODO: Implement delete category
  return c.json({ message: "Not implemented" }, 501);
});

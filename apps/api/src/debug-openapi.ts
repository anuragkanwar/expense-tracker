import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";

// Create a minimal OpenAPIHono app for testing
const app = new OpenAPIHono();

// Define a simple test route
const testRoute = createRoute({
  method: "get",
  path: "/test",
  summary: "Test route",
  description: "A test route to debug OpenAPI generation",
  tags: ["Debug"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "It works!" }),
          }),
        },
      },
      description: "Test successful",
    },
  },
});

// Register the route
app.openapi(testRoute, (c) => {
  return c.json({ message: "It works!" });
});

// Try to generate OpenAPI spec
try {
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Debug API",
      description: "A minimal API for debugging OpenAPI generation",
    },
  });
  console.log("OpenAPI schema generated successfully");
} catch (error) {
  console.error("OpenAPI generation error:", error);
}

// Start the server
export default {
  fetch: app.fetch,
  port: 3002,
};

import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from "@scalar/hono-api-reference";
import studentRoutes from "@/routes/students";
import authRoutes from "@/routes/auth";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/middleware/logger";
import { diMiddleware } from "@/middleware/di-middleware";

// API setup
const app = new OpenAPIHono();

// Global middlewares
app.use("*", logger());
app.use("*", diMiddleware);
app.use("*", errorHandler());

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Pocket Pixie API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    docs: "http://localhost:3000/docs",
  });
});

// API info endpoint
app.get("/health", (c) => {
  return c.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount auth routes
app.route("/api/auth", authRoutes);

// Mount student routes
app.route("/students", studentRoutes);

// OpenAPI documentation - generated from Zod schemas
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'Student Management API',
    description: 'An API for managing student records.',
  },
});

// Scalar API Reference UI
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Pocket Pixie API",
  })
);

// 404 handler (handled by error middleware)
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found",
      },
    },
    404 as any
  );
});

export default app;

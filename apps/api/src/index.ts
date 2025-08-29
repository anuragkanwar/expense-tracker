import { Hono } from "hono";
import studentRoutes from "@/routes/students";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/middleware/logger";

// API setup with proper architecture and middlewares
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", errorHandler());

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Pocket Pixie API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
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

// Mount student routes
app.route("/students", studentRoutes);

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

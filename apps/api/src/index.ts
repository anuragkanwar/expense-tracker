import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/logger";
import { rateLimit } from "./middleware/rate-limit";
import authRoutes from "./routes/auth";
import healthRoutes from "./routes/health";
import apiRoutes from "./routes/api";

const app = new Hono();

// Global error handler (must be first)
app.use("*", errorHandler);

// Global CORS middleware
app.use("*", corsMiddleware);

// Request logging
app.use("*", requestLogger);

// Rate limiting for API routes
app.use("/api/*", rateLimit);

// Health check (no auth required)
app.route("/", healthRoutes);

// Authentication routes
app.route("/api/auth", authRoutes);

// Protected API routes
app.route("/api", apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found",
      },
    },
    404
  );
});

export default app;

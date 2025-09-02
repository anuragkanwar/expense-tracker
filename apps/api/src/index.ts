import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/middleware/logger";
import { dependencyInjector } from "@/middleware/di-middleware";
import {
  authRoutes,
  userRoutes,
  friendRoutes,
  groupRoutes,
  expenseRoutes,
  passbookRoutes,
  budgetRoutes,
  connectionRoutes,
  studentRoutes,
} from "./routes";

import { cors } from "hono/cors";
// API setup
const app = new OpenAPIHono();

// Global middlewares
app.use("*", logger());
app.use("*", dependencyInjector);
app.use("*", errorHandler());
app.use(
  "/api/*", // Enable CORS for all API routes
  cors({
    origin: [
      "pocket-pixie://",
      "http://localhost:3000",
      "http://localhost:8081",
      "http://YOUR_COMPUTER_IP:3000", // Replace with your computer's IP
    ], // replace with your origin
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);
// Health check endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Pocket Pixie API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    docs: "http://localhost:3000/docs",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      friends: "/api/v1/friends",
      groups: "/api/v1/groups",
      expenses: "/api/v1/expenses",
      passbook: "/api/v1/passbook",
      budgets: "/api/v1/budgets",
      connections: "/api/v1/connections",
    },
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

// Mount authentication routes
app.route("/api/v1/auth", authRoutes);

// Mount user management routes
app.route("/api/v1/users", userRoutes);

// Mount social features routes
app.route("/api/v1/friends", friendRoutes);

// Mount group management routes
app.route("/api/v1/groups", groupRoutes);

// Mount expense management routes
app.route("/api/v1/expenses", expenseRoutes);

// Mount financial tracking routes
app.route("/api/v1/passbook", passbookRoutes);

// Mount budgeting routes
app.route("/api/v1/budgets", budgetRoutes);

// Mount external connections routes
app.route("/api/v1/connections", connectionRoutes);

// Mount student routes (legacy)
app.route("/api/students", studentRoutes);

// OpenAPI documentation - generated from Zod schemas
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Pocket Pixie API",
    description:
      "A comprehensive financial management API for expense tracking, budgeting, group expenses, and financial insights.",
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

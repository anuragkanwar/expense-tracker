import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { errorHandler } from "@/middleware/error-handler";
import { logger } from "@/middleware/logger";
import { dependencyInjector } from "@/middleware/di-middleware";
import { authMiddeware } from "./middleware/auth-middleware";
import {
  authRoutes,
  friendRoutes,
  groupRoutes,
  transactionRoutesExport,
  loanRoutes,
  passbookRoutes,
  budgetRoutes,
  accountRoutes,
  recurringItemRoutes,
  balanceRoutes,
  dashboardRoutes,
  connectionRoutes,
  settlementRoutes,
} from "./routes";

import { cors } from "hono/cors";
import { auth } from "@/db";
// API setup
const app = new OpenAPIHono();

// Global middlewares
app.use("*", logger());
app.use("*", dependencyInjector);
app.use("*", errorHandler());
app.use("*", authMiddeware());
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
    docs: "http://localhost:4000/docs",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      friends: "/api/v1/friends",
      groups: "/api/v1/groups",
      loans: "/api/v1/loans",
      transactions: "/api/v1/transactions",
      passbook: "/api/v1/passbook",
      budgets: "/api/v1/budgets",
      accounts: "/api/v1/accounts",
      categories: "/api/v1/categories",
      "recurring-items": "/api/v1/recurring-items",
      balances: "/api/v1/balances",
      dashboard: "/api/v1/dashboard",
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

// Mount auth extended routes
app.route("/api/v1/auth", authRoutes);

// Mount authentication routes
app.on(["POST", "GET"], "/api/v1/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Mount social features routes
app.route("/api/v1/friends", friendRoutes);

// Mount group management routes
app.route("/api/v1/groups", groupRoutes);

// Mount transaction management routes
app.route("/api/v1/transactions", transactionRoutesExport);

// Mount loan routes (direct loans)
app.route("/api/v1/loans", loanRoutes);

// Mount financial tracking routes
app.route("/api/v1/passbook", passbookRoutes);

// Mount budgeting routes
app.route("/api/v1/budgets", budgetRoutes);

// Mount personal finance routes
app.route("/api/v1/accounts", accountRoutes);

// Mount recurring-items routes
app.route("/api/v1/recurring-items", recurringItemRoutes);

// Mount balances and settlements routes
app.route("/api/v1/balances", balanceRoutes);
app.route("/api/v1/settlements", settlementRoutes);

// Mount dashboard routes
app.route("/api/v1/dashboard", dashboardRoutes);

// Mount external connections routes
app.route("/api/v1/connections", connectionRoutes);

// OpenAPI documentation - generated from Zod schemas
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Pocket Pixie API",
    description:
      "A comprehensive financial management API for loan tracking, budgeting, group loans, and financial insights.",
  },
});

// Scalar API Reference UI
app.get(
  "/docs",
  Scalar({
    sources: [
      {
        title: "Main API",
        url: "/openapi.json",
      },
      {
        title: "Authentication Api",
        url: "/api/v1/auth/open-api/generate-schema",
      },
    ],
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
    404
  );
});

export default {
  fetch: app.fetch,
  port: 3000,
  hostname: "0.0.0.0",
};

import { Hono } from "hono";
import { db } from "@pocket-pixie/db";

const app = new Hono();

/**
 * Health check routes
 * Provides system status and health information
 */

// Basic health check
app.get("/", async (c) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  return c.json({
    success: true,
    data: {
      status: "healthy",
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
    },
  });
});

// Detailed health check with database connectivity
app.get("/detailed", async (c) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  // Check database connectivity
  let dbStatus = "unknown";
  let dbResponseTime = 0;

  try {
    const start = Date.now();
    // Simple database connectivity check
    await db.$client.exec("SELECT 1");
    dbResponseTime = Date.now() - start;
    dbStatus = "healthy";
  } catch (error) {
    dbStatus = "unhealthy";
    console.error("Database health check failed:", error);
  }

  // System information
  const memoryUsage = process.memoryUsage();
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
  };

  return c.json({
    success: true,
    data: {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`,
        },
      },
      system: {
        ...systemInfo,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
      },
    },
  });
});

// Readiness check (for Kubernetes/load balancers)
app.get("/ready", async (c) => {
  try {
    // Quick database check
    db.$client.exec("SELECT 1");

    return c.json({
      success: true,
      data: {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_READY",
          message: "Service is not ready",
        },
      },
      503
    );
  }
});

export default app;

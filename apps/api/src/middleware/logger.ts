import { logger } from "hono/logger";
import type { MiddlewareHandler } from "hono";

/**
 * Enhanced request logging middleware
 * Provides detailed request/response logging with performance metrics
 */
export const requestLogger: MiddlewareHandler = logger((message, ...rest) => {
  // Enhanced logging with timestamp and request ID
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID().substring(0, 8);

  console.log(`[${timestamp}] [${requestId}] ${message}`, ...rest);
});

/**
 * Performance monitoring middleware
 * Logs response time for each request
 */
export const performanceLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const end = Date.now();
  const duration = end - start;
  const status = c.res.status;

  // Log slow requests (>500ms)
  if (duration > 500) {
    console.warn(
      `🐌 Slow request: ${method} ${path} - ${duration}ms [${status}]`
    );
  } else if (process.env.NODE_ENV === "development") {
    console.log(`⚡ ${method} ${path} - ${duration}ms [${status}]`);
  }
};

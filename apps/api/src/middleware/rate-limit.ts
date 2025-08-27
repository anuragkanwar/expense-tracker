import type { MiddlewareHandler } from "hono";

/**
 * Simple in-memory rate limiting middleware
 * In production, consider using Redis or a dedicated rate limiting service
 */

// Store for rate limiting data
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === "production" ? 100 : 1000,
};

/**
 * Rate limiting middleware
 * Limits requests per IP address within a time window
 */
export const rateLimit: MiddlewareHandler = async (c, next) => {
  // Skip rate limiting for health checks and auth endpoints
  if (c.req.path === "/" || c.req.path.startsWith("/api/auth")) {
    return next();
  }

  const ip = getClientIP(c);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Get or create rate limit data for this IP
  const rateLimitData = rateLimitStore.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT_CONFIG.windowMs,
  };

  // Reset counter if window has expired
  if (rateLimitData.resetTime <= now) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + RATE_LIMIT_CONFIG.windowMs;
  }

  // Check if rate limit exceeded
  if (rateLimitData.count >= RATE_LIMIT_CONFIG.maxRequests) {
    const resetTime = Math.ceil((rateLimitData.resetTime - now) / 1000);

    return c.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
          retryAfter: resetTime,
        },
      },
      429,
      {
        "Retry-After": resetTime.toString(),
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": rateLimitData.resetTime.toString(),
      }
    );
  }

  // Increment request count
  rateLimitData.count++;
  rateLimitStore.set(ip, rateLimitData);

  // Add rate limit headers
  c.header("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxRequests.toString());
  c.header(
    "X-RateLimit-Remaining",
    (RATE_LIMIT_CONFIG.maxRequests - rateLimitData.count).toString()
  );
  c.header("X-RateLimit-Reset", rateLimitData.resetTime.toString());

  await next();
};

/**
 * Get client IP address from request
 */
function getClientIP(c: any): string {
  // Check various headers for the real IP
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = c.req.header("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = c.req.header("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to remote address
  return c.req.header("remote-addr") || "unknown";
}

/**
 * Clean up old rate limit data periodically
 * In production, consider using a proper cleanup mechanism
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.resetTime <= now) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Clean every minute

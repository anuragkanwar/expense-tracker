import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * CORS middleware with environment-aware configuration
 * Supports development, staging, and production environments
 */
export const corsMiddleware: MiddlewareHandler = cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return origin;

    const allowedOrigins = getAllowedOrigins();

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === "*") return true;
      if (allowedOrigin.startsWith("http")) {
        return origin === allowedOrigin;
      }
      // For custom schemes (mobile apps)
      return origin.startsWith(allowedOrigin);
    });

    return isAllowed ? origin : null;
  },
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  exposeHeaders: ["Content-Length", "X-Request-ID"],
  maxAge: 86400, // 24 hours
  credentials: true,
});

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return [
        "https://your-production-domain.com",
        "https://api.your-production-domain.com",
        "pocket-pixie://", // Mobile app
      ];

    case "staging":
      return [
        "https://staging.your-domain.com",
        "https://api-staging.your-domain.com",
        "pocket-pixie-staging://",
        "http://localhost:3000", // For testing
        "http://localhost:8081", // Expo
      ];

    case "development":
    default:
      return [
        "http://localhost:3000", // API server
        "http://localhost:8081", // Expo dev server
        "http://localhost:19006", // Expo web
        "pocket-pixie://", // Mobile app
        "pocket-pixie-dev://", // Dev mobile app
        "*", // Allow all for development (be careful!)
      ];
  }
}

import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Global error handler middleware
 * Provides consistent error responses across the API
 */
export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("API Error:", error);

    // Handle different types of errors
    if (error instanceof HTTPException) {
      return c.json(
        {
          success: false,
          error: {
            code: getErrorCode(error.status),
            message: error.message,
            ...(process.env.NODE_ENV === "development" && {
              stack: error.stack,
            }),
          },
        },
        error.status
      );
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
          },
        },
        400
      );
    }

    // Handle database errors
    if (error && typeof error === "object" && "code" in error) {
      const dbError = error as { code: string; message: string };

      if (dbError.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return c.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_ENTRY",
              message: "Resource already exists",
            },
          },
          409
        );
      }
    }

    // Generic server error
    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message:
            process.env.NODE_ENV === "development"
              ? (error as Error).message
              : "An unexpected error occurred",
          ...(process.env.NODE_ENV === "development" && {
            stack: (error as Error).stack,
          }),
        },
      },
      500
    );
  }
};

/**
 * Convert HTTP status codes to error codes
 */
function getErrorCode(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    case 502:
      return "BAD_GATEWAY";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "UNKNOWN_ERROR";
  }
}

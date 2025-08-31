import { MiddlewareHandler } from "hono";
import { BaseError, ValidationError } from "../errors/base-error";

export const errorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      // Log error in non-production environments
      if (process.env.NODE_ENV !== "production") {
        console.error("Error caught by error handler:", error);
      }

      // Handle custom BaseError instances
      if (error instanceof BaseError) {
        return c.json(error.toJSON(), error.statusCode as any);
      }

      // Handle Zod validation errors
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "ZodError"
      ) {
        const zodError = error as any;
        const validationError = new ValidationError(
          "Validation failed",
          zodError.errors
        );
        return c.json(
          validationError.toJSON(),
          validationError.statusCode as any
        );
      }

      // Handle database errors
      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as any;

        // SQLite constraint violation (e.g., unique constraint)
        if (dbError.code === "SQLITE_CONSTRAINT") {
          return c.json(
            {
              success: false,
              error: {
                code: "CONSTRAINT_VIOLATION",
                message: "Database constraint violation",
              },
            },
            409 as any
          );
        }

        // SQLite connection errors
        if (dbError.code === "SQLITE_ERROR") {
          return c.json(
            {
              success: false,
              error: {
                code: "DATABASE_ERROR",
                message: "Database operation failed",
              },
            },
            500 as any
          );
        }
      }

      // Generic internal server error
      const internalError = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred"
              : error instanceof Error
                ? error.message
                : "Unknown error",
        },
      };

      return c.json(internalError, 500 as any);
    }
  };
};

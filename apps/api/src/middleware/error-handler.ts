import { MiddlewareHandler } from "hono";
import { BaseError, ValidationError } from "@/errors/base-error";
import { ZodError, type z } from "zod";
import { getErrorMessage } from "@/utils/error-response-handler";
import { type HttpStatus } from "@pocket-pixie/contracts";

// Narrowed internal representation of a Zod issue we expose
interface MinimalZodIssue {
  message: string;
  path?: (string | number)[];
  code?: string;
  [key: string]: unknown;
}

export const errorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next();
    } catch (error: unknown) {
      // Log in non-production for observability
      if (process.env.NODE_ENV !== "production") {
        console.error("Error caught by error handler:", error);
      }

      // 1. Domain / operational errors (already shaped & trusted)
      if (error instanceof BaseError) {
        const json = error.toJSON();
        const status = error.statusCode as HttpStatus;
        return c.json(json, status);
      }

      // 2. Zod validation errors → wrap in our ValidationError for uniform contract
      if (error instanceof ZodError) {
        const details: MinimalZodIssue[] = (error.issues || []).map(
          (issue: z.ZodIssue): MinimalZodIssue => ({
            message: issue.message,
            path: issue.path as (string | number)[],
            code: issue.code, // zod's internal code (string)
          })
        );
        const validationError = new ValidationError(
          "Validation failed",
          details
        );
        return c.json(
          validationError.toJSON(),
          validationError.statusCode as 400
        );
      }

      // 3. Database / driver style errors (currently only basic sqlite codes mapped)
      if (error && typeof error === "object" && "code" in error) {
        const codeVal = (error as { code?: unknown }).code;
        if (codeVal === "SQLITE_CONSTRAINT") {
          return c.json(
            {
              success: false,
              error: {
                code: "CONSTRAINT_VIOLATION",
                message: "Database constraint violation",
              },
            },
            409
          );
        }
        if (codeVal === "SQLITE_ERROR") {
          return c.json(
            {
              success: false,
              error: {
                code: "DATABASE_ERROR",
                message: "Database operation failed",
              },
            },
            500
          );
        }
      }

      // 4. Generic / unknown fallback (avoid leaking details in production)
      const message =
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : getErrorMessage(error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message,
          },
        },
        500
      );
    }
  };
};

import { BaseError, ForbiddenError, NotFoundError } from "@/errors/base-error";

// Generic application error union (kept for backwards compatibility with existing imports)
export type AppError = BaseError | Error | unknown;

// Narrow HTTP status codes we intentionally emit for error responses
export type HttpStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ErrorResponse {
  json: ErrorBody; // Standardised error body
  status: HttpStatus; // HTTP status code
}

/**
 * Safely derive a human-readable message from an unknown error value.
 * Never throws – always returns a string.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BaseError) return error.message;
  if (error instanceof Error) return error.message || "Unknown error";
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

/**
 * Convert an unknown error into a serialisable error response adhering
 * to the project-wide error contract (success: false, error: { ... }).
 */
export const handleRouteError = (error: unknown): ErrorResponse => {
  // Custom domain errors – fully trusted & already shaped
  if (error instanceof BaseError) {
    return {
      json: error.toJSON() as ErrorBody,
      status: error.statusCode as HttpStatus,
    };
  }

  // Standard JS / library Error instances – inspect message heuristically
  if (error instanceof Error) {
    const msg = error.message || "Unknown error";

    // Respect explicit statusCode/status if provided (e.g. from mocked or 3rd-party errors)
    const explicitStatus = error?.statusCode ?? (error as any)?.status;
    const allowedStatuses: number[] = [400, 401, 403, 404, 409, 422];
    if (
      typeof explicitStatus === "number" &&
      allowedStatuses.includes(explicitStatus)
    ) {
      // If the error exposes a toJSON that matches our contract, trust it
      if (typeof (error as any).toJSON === "function") {
        try {
          const candidate = (error as any).toJSON();
          if (candidate && candidate.success === false && candidate.error) {
            return {
              json: candidate as ErrorBody,
              status: explicitStatus as HttpStatus,
            };
          }
        } catch {
          // fall through to generic mapping
        }
      }
      // Fallback mapping based on status code
      const codeMap: Record<number, string> = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
      };
      return {
        json: {
          success: false,
          error: { code: codeMap[explicitStatus] || "ERROR", message: msg },
        },
        status: explicitStatus as HttpStatus,
      };
    }

    if (msg.toLowerCase().includes("not found")) {
      return {
        json: {
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        },
        status: 404,
      };
    }

    if (/(access|permission)/i.test(msg)) {
      const forbidden = new ForbiddenError("Access denied");
      return { json: forbidden.toJSON() as ErrorBody, status: 403 };
    }

    if (/validation/i.test(msg)) {
      return {
        json: {
          success: false,
          error: { code: "VALIDATION_ERROR", message: msg },
        },
        status: 400,
      };
    }

    return {
      json: {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred"
              : msg,
        },
      },
      status: 500,
    };
  }

  // Unknown / non-Error throw values – coerce safely
  return {
    json: {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : getErrorMessage(error),
      },
    },
    status: 500,
  };
};

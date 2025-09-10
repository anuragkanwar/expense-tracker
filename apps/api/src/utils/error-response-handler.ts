import { BaseError, NotFoundError, ForbiddenError } from "@/errors/base-error";

export type AppError = BaseError | Error | unknown;

export const handleRouteError = (
  error: AppError
): { json: any; status: number } => {
  // Handle custom BaseError instances
  if (error instanceof BaseError) {
    return { json: error.toJSON(), status: error.statusCode };
  }

  // Handle Error instances
  if (error instanceof Error) {
    if (error.message.includes("not found")) {
      const notFound = new NotFoundError("Resource");
      return { json: notFound.toJSON(), status: notFound.statusCode };
    }
    if (
      error.message.includes("access") ||
      error.message.includes("permission")
    ) {
      const forbidden = new ForbiddenError("Access denied");
      return { json: forbidden.toJSON(), status: forbidden.statusCode };
    }
    if (error.message.includes("Validation")) {
      return {
        json: {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        },
        status: 400,
      };
    }

    // Generic internal server error for Error instances
    return {
      json: {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred"
              : error.message,
        },
      },
      status: 500,
    };
  }

  // Handle unknown errors
  return {
    json: {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : "Unknown error",
      },
    },
    status: 500,
  };
};

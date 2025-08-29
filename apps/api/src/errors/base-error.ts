export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }

  // Override toJSON for ValidationError
  protected getBaseJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

export class ValidationError extends BaseError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400);
    this.details = details;
  }

  override toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = "Internal server error") {
    super(message, "INTERNAL_ERROR", 500);
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, "BAD_REQUEST", 400);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}
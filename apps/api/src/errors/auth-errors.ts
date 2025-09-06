import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
} from "./base-error";

export class AuthNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Auth", identifier);
  }
}

export class AuthConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class AuthValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class AuthUnauthorizedError extends UnauthorizedError {
  constructor(message = "Authentication failed") {
    super(message);
  }
}

export class AuthServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Auth ${operation} failed: ${message}`);
    this.name = "AuthServiceError";
    this.operation = operation;
  }
}

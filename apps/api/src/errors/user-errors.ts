import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("User", identifier);
  }
}

export class UserConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class UserValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class UserServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`User ${operation} failed: ${message}`);
    this.name = "UserServiceError";
    this.operation = operation;
  }
}

import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class SessionNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Session", identifier);
  }
}

export class SessionConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class SessionValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class SessionServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Session ${operation} failed: ${message}`);
    this.name = "SessionServiceError";
    this.operation = operation;
  }
}

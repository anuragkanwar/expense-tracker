import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class ConnectionNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Connection", identifier);
  }
}

export class ConnectionConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class ConnectionValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class ConnectionServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Connection ${operation} failed: ${message}`);
    this.name = "ConnectionServiceError";
    this.operation = operation;
  }
}

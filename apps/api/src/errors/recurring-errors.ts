import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class RecurringNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Recurring", identifier);
  }
}

export class RecurringConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class RecurringValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class RecurringServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Recurring ${operation} failed: ${message}`);
    this.name = "RecurringServiceError";
    this.operation = operation;
  }
}

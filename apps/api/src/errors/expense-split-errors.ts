import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class ExpenseSplitNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("ExpenseSplit", identifier);
  }
}

export class ExpenseSplitConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class ExpenseSplitValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class ExpenseSplitServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`ExpenseSplit ${operation} failed: ${message}`);
    this.name = "ExpenseSplitServiceError";
    this.operation = operation;
  }
}

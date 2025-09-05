import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class ExpensePayerNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("ExpensePayer", identifier);
  }
}

export class ExpensePayerConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class ExpensePayerValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class ExpensePayerServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`ExpensePayer ${operation} failed: ${message}`);
    this.name = "ExpensePayerServiceError";
    this.operation = operation;
  }
}

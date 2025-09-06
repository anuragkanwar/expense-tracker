import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class ExpenseNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Expense", identifier);
  }
}

export class ExpenseConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class ExpenseValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class ExpenseServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Expense ${operation} failed: ${message}`);
    this.name = "ExpenseServiceError";
    this.operation = operation;
  }
}

import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class TransactionCategoryNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("TransactionCategory", identifier);
  }
}

export class TransactionCategoryConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionCategoryValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class TransactionCategoryServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`TransactionCategory ${operation} failed: ${message}`);
    this.name = "TransactionCategoryServiceError";
    this.operation = operation;
  }
}

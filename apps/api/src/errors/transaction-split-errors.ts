import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class TransactionSplitNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("TransactionSplit", identifier);
  }
}

export class TransactionSplitConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionSplitValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class TransactionSplitServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`TransactionSplit ${operation} failed: ${message}`);
    this.name = "TransactionSplitServiceError";
    this.operation = operation;
  }
}

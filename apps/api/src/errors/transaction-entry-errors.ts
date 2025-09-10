import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class TransactionEntryNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("TransactionEntry", identifier);
  }
}

export class TransactionEntryConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionEntryValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class TransactionEntryServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`TransactionEntry ${operation} failed: ${message}`);
    this.name = "TransactionEntryServiceError";
    this.operation = operation;
  }
}

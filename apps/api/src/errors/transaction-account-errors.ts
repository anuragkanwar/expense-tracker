import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class TransactionAccountNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("TransactionAccount", identifier);
  }
}

export class TransactionAccountConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionAccountValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class TransactionAccountServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`TransactionAccount ${operation} failed: ${message}`);
    this.name = "TransactionAccountServiceError";
    this.operation = operation;
  }
}

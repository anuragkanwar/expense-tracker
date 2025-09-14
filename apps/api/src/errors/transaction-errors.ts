import {
  NotFoundError,
  ConflictError,
  ValidationError,
  type ValidationErrorDetail,
} from "./base-error";

export class TransactionNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Transaction", identifier);
  }
}

export class TransactionConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionValidationError extends ValidationError {
  constructor(message: string, details?: ValidationErrorDetail[]) {
    super(message, details);
  }
}

export class TransactionServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Transaction ${operation} failed: ${message}`);
    this.name = "TransactionServiceError";
    this.operation = operation;
  }
}

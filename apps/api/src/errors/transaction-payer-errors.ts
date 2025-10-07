import {
  NotFoundError,
  ConflictError,
  ValidationError,
  type ValidationErrorDetail,
} from "./base-error";

export class TransactionPayerNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("TransactionPayer", identifier);
  }
}

export class TransactionPayerConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class TransactionPayerValidationError extends ValidationError {
  constructor(message: string, details?: ValidationErrorDetail[]) {
    super(message, details);
  }
}

export class TransactionPayerServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`TransactionPayer ${operation} failed: ${message}`);
    this.name = "TransactionPayerServiceError";
    this.operation = operation;
  }
}

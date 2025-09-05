import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class PassbookNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Passbook", identifier);
  }
}

export class PassbookConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class PassbookValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class PassbookServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Passbook ${operation} failed: ${message}`);
    this.name = "PassbookServiceError";
    this.operation = operation;
  }
}

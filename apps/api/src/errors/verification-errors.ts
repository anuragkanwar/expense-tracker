import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class VerificationNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Verification", identifier);
  }
}

export class VerificationConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class VerificationValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class VerificationServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Verification ${operation} failed: ${message}`);
    this.name = "VerificationServiceError";
    this.operation = operation;
  }
}

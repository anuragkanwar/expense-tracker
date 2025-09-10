import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class SettlementNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Settlement", identifier);
  }
}

export class SettlementConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class SettlementValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class SettlementServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Settlement ${operation} failed: ${message}`);
    this.name = "SettlementServiceError";
    this.operation = operation;
  }
}

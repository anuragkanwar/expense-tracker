import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class AccountNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Account", identifier);
  }
}

export class AccountConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class AccountValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class AccountServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Account ${operation} failed: ${message}`);
    this.name = "AccountServiceError";
    this.operation = operation;
  }
}

import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class UserBalanceNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("UserBalance", identifier);
  }
}

export class UserBalanceConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class UserBalanceValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class UserBalanceServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`UserBalance ${operation} failed: ${message}`);
    this.name = "UserBalanceServiceError";
    this.operation = operation;
  }
}

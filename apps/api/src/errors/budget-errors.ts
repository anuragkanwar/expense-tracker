import {
  NotFoundError,
  ConflictError,
  ValidationError,
  type ValidationErrorDetail,
} from "./base-error";

export class BudgetNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Budget", identifier);
  }
}

export class BudgetConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class BudgetValidationError extends ValidationError {
  constructor(message: string, details?: ValidationErrorDetail[]) {
    super(message, details);
  }
}

export class BudgetServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Budget ${operation} failed: ${message}`);
    this.name = "BudgetServiceError";
    this.operation = operation;
  }
}

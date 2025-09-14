import {
  NotFoundError,
  ConflictError,
  ValidationError,
  type ValidationErrorDetail,
} from "./base-error";

export class DashboardNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Dashboard", identifier);
  }
}

export class DashboardConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class DashboardValidationError extends ValidationError {
  constructor(message: string, details?: ValidationErrorDetail[]) {
    super(message, details);
  }
}

export class DashboardServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Dashboard ${operation} failed: ${message}`);
    this.name = "DashboardServiceError";
    this.operation = operation;
  }
}

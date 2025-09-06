import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class CategoryNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Category", identifier);
  }
}

export class CategoryConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class CategoryValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class CategoryServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Category ${operation} failed: ${message}`);
    this.name = "CategoryServiceError";
    this.operation = operation;
  }
}

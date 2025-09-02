import { NotFoundError, ConflictError } from "./base-error";

export class StudentNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Student", identifier);
  }
}

export class StudentEmailConflictError extends ConflictError {
  constructor(email: string) {
    super(`Student with email '${email}' already exists`);
  }
}

export class StudentValidationError extends Error {
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = "StudentValidationError";
    this.details = details;
  }
}

export class StudentServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Student ${operation} failed: ${message}`);
    this.name = "StudentServiceError";
    this.operation = operation;
  }
}

import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class GroupNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Group", identifier);
  }
}

export class GroupConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class GroupValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class GroupServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Group ${operation} failed: ${message}`);
    this.name = "GroupServiceError";
    this.operation = operation;
  }
}

import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class GroupMemberNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("GroupMember", identifier);
  }
}

export class GroupMemberConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class GroupMemberValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class GroupMemberServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`GroupMember ${operation} failed: ${message}`);
    this.name = "GroupMemberServiceError";
    this.operation = operation;
  }
}

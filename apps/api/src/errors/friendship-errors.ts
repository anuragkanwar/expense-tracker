import { NotFoundError, ConflictError, ValidationError } from "./base-error";

export class FriendshipNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super("Friendship", identifier);
  }
}

export class FriendshipConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class FriendshipValidationError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

export class FriendshipServiceError extends Error {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Friendship ${operation} failed: ${message}`);
    this.name = "FriendshipServiceError";
    this.operation = operation;
  }
}

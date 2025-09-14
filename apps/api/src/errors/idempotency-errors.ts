import { BaseError } from "./base-error";

export class IdempotencyKeyRequiredError extends BaseError {
  constructor(message: string = "Idempotency-Key header required") {
    super(message, "IDMP_KEY_REQUIRED", 400);
  }
}

export interface IdempotencyConflictDifferencesValue {
  original: unknown;
  attempted: unknown;
}
export interface IdempotencyConflictDifferences {
  [field: string]: IdempotencyConflictDifferencesValue;
}

export class IdempotencyKeyConflictError extends BaseError {
  public readonly differences?: IdempotencyConflictDifferences;
  constructor(
    message: string = "Idempotency-Key conflict",
    differences?: IdempotencyConflictDifferences
  ) {
    super(message, "IDMP_KEY_CONFLICT", 409);
    this.differences = differences;
  }

  override toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        differences: this.differences,
      },
    };
  }
}

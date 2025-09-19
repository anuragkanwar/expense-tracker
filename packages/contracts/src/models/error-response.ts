// Generic application error union
export type AppError = Error | unknown;

// Narrow HTTP status codes we intentionally emit for error responses
export type HttpStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ErrorResponse {
  json: ErrorBody; // Standardised error body
  status: HttpStatus; // HTTP status code
}

/**
 * ValidationErrorDetail interface used across error types
 */
export interface ValidationErrorDetail {
  path?: (string | number)[];
  message: string;
  code?: string;
  [key: string]: unknown;
}

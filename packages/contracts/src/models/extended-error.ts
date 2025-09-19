/**
 * Interface for extended errors with status code information
 */
export interface StatusCodeError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Interface for errors that can be serialized to JSON
 */
export interface JSONSerializableError extends Error {
  toJSON(): {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
}

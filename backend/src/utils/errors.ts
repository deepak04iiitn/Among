import { type ErrorCode } from '../constants/errorCodes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'ERR_UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'ERR_FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', code: ErrorCode = 'ERR_NOT_FOUND') {
    super(`${resource} not found`, 404, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'ERR_VALIDATION', details);
  }
}

export class RateLimitError extends AppError {
  constructor(code: ErrorCode = 'ERR_RATE_LIMITED', message = 'Rate limit exceeded') {
    super(message, 429, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode) {
    super(message, 409, code);
  }
}

/** Checks if an error is an operational AppError (expected, safe to send to client) */
export function isOperationalError(err: unknown): err is AppError {
  return err instanceof AppError && err.isOperational;
}

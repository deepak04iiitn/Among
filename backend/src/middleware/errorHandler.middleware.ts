import type { Request, Response, NextFunction } from 'express';
import { AppError, isOperationalError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ERR_INTERNAL } from '../constants/errorCodes';

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (isOperationalError(err)) {
    const body: ErrorResponse = {
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Non-operational (programming errors) — log full stack, return generic 500
  logger.error('Unhandled error', { err });

  res.status(500).json({
    success: false,
    code: ERR_INTERNAL,
    message: 'An unexpected error occurred.',
  } satisfies ErrorResponse);
}

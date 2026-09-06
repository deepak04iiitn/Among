import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/posts', validate(CreatePostSchema), postController.create)
 *   router.get('/posts', validate(ListPostsQuerySchema, 'query'), postController.list)
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (result.success) {
      // Replace the original data with the parsed (coerced + stripped) version
      // so downstream handlers receive clean, typed data
      (req as unknown as Record<string, unknown>)[part] = result.data;
      next();
      return;
    }

    const details = formatZodErrors(result.error);
    next(new ValidationError('Validation failed', details));
  };
}

/**
 * Validates multiple parts of the request in a single middleware.
 * All parts are validated — all errors collected before rejecting.
 */
export function validateAll(schemas: Partial<Record<RequestPart, ZodSchema>>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: Record<string, unknown> = {};
    let hasErrors = false;

    for (const [part, schema] of Object.entries(schemas) as [RequestPart, ZodSchema][]) {
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        (req as unknown as Record<string, unknown>)[part] = result.data;
      } else {
        allErrors[part] = formatZodErrors(result.error);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      next(new ValidationError('Validation failed', allErrors));
      return;
    }

    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

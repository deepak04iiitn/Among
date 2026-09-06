import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ConflictError,
  isOperationalError,
} from './errors';

describe('AppError', () => {
  it('creates error with correct properties', () => {
    const err = new AppError('something went wrong', 400, 'ERR_VALIDATION');
    expect(err.message).toBe('something went wrong');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('ERR_VALIDATION');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('stores optional details', () => {
    const details = { field: ['required'] };
    const err = new AppError('fail', 400, 'ERR_VALIDATION', details);
    expect(err.details).toEqual(details);
  });

  it('defaults isOperational to true', () => {
    const err = new AppError('x', 500, 'ERR_INTERNAL');
    expect(err.isOperational).toBe(true);
  });

  it('allows isOperational to be set false for programming errors', () => {
    const err = new AppError('crash', 500, 'ERR_INTERNAL', undefined, false);
    expect(err.isOperational).toBe(false);
  });

  it('has a stack trace', () => {
    const err = new AppError('x', 400, 'ERR_VALIDATION');
    expect(err.stack).toBeDefined();
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401 and ERR_UNAUTHORIZED code', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('ERR_UNAUTHORIZED');
  });

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403 and ERR_FORBIDDEN code', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('ERR_FORBIDDEN');
  });
});

describe('NotFoundError', () => {
  it('uses default resource name', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('ERR_NOT_FOUND');
    expect(err.message).toContain('not found');
  });

  it('uses custom resource name', () => {
    const err = new NotFoundError('Post');
    expect(err.message).toBe('Post not found');
  });

  it('uses custom error code', () => {
    const err = new NotFoundError('Post', 'ERR_POST_NOT_FOUND');
    expect(err.code).toBe('ERR_POST_NOT_FOUND');
  });
});

describe('ValidationError', () => {
  it('has statusCode 400 and ERR_VALIDATION code', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('ERR_VALIDATION');
  });

  it('stores field-level details', () => {
    const details = { body: ['required'] };
    const err = new ValidationError('invalid input', details);
    expect(err.details).toEqual(details);
  });
});

describe('RateLimitError', () => {
  it('has statusCode 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('ERR_RATE_LIMITED');
  });

  it('accepts a specific rate limit code', () => {
    const err = new RateLimitError('ERR_DAILY_POST_LIMIT');
    expect(err.code).toBe('ERR_DAILY_POST_LIMIT');
  });
});

describe('ConflictError', () => {
  it('has statusCode 409', () => {
    const err = new ConflictError('already blocked', 'ERR_ALREADY_BLOCKED');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('ERR_ALREADY_BLOCKED');
  });
});

describe('isOperationalError', () => {
  it('returns true for AppError subclasses', () => {
    expect(isOperationalError(new UnauthorizedError())).toBe(true);
    expect(isOperationalError(new ForbiddenError())).toBe(true);
    expect(isOperationalError(new ValidationError())).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isOperationalError(new Error('boom'))).toBe(false);
  });

  it('returns false for non-operational AppError', () => {
    const err = new AppError('crash', 500, 'ERR_INTERNAL', undefined, false);
    expect(isOperationalError(err)).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError('string')).toBe(false);
    expect(isOperationalError(42)).toBe(false);
    expect(isOperationalError(undefined)).toBe(false);
  });
});

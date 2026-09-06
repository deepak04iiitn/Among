/**
 * analytics.middleware.test.ts — Tests for the analytics Express middleware.
 *
 * Critical invariants:
 *  - Middleware calls next() — never blocks the request.
 *  - Events are emitted only after response finish.
 *  - Unknown routes do not emit events.
 *  - Unauthenticated requests do not emit events.
 *  - Middleware never throws.
 */
import { analyticsMiddleware } from './analytics.middleware';
import * as analyticsService   from './analytics.service';
import type { Request, Response } from 'express';

jest.mock('./analytics.service', () => ({
  emitEvent:    jest.fn(),
  hashAccountId: jest.fn().mockReturnValue('hashed-id'),
}));

const mockEmit = analyticsService.emitEvent as jest.Mock;

function buildMocks(overrides?: Partial<Request>): {
  req: Partial<Request>;
  res: Partial<Response> & { on: jest.Mock; statusCode: number };
  next: jest.Mock;
} {
  const finishListeners: (() => void)[] = [];
  const res = {
    statusCode: 200,
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'finish') finishListeners.push(cb);
    }),
    _triggerFinish: () => finishListeners.forEach((cb) => cb()),
  } as unknown as Partial<Response> & { on: jest.Mock; statusCode: number; _triggerFinish: () => void };

  const req: Partial<Request> = {
    method: 'POST',
    path:   '/api/posts',
    headers: {},
    body:   {},
    user:   { accountId: 'user-1', firebaseUid: 'fb-1', role: 'user', isBanned: false, hasCompletedOnboarding: true },
    ...overrides,
  };
  return { req, res, next: jest.fn() };
}

beforeEach(() => { jest.resetAllMocks(); });

describe('analyticsMiddleware', () => {
  it('always calls next()', () => {
    const { req, res, next } = buildMocks();
    analyticsMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('emits POST_CREATED event after POST /api/posts with 201', () => {
    const { req, res, next } = buildMocks({
      method: 'POST',
      path:   '/api/posts',
    });
    (res as unknown as { statusCode: number }).statusCode = 201;
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'post_created' })
    );
  });

  it('does NOT emit event for POST /api/posts with non-201 status', () => {
    const { req, res, next } = buildMocks({
      method: 'POST',
      path:   '/api/posts',
    });
    (res as unknown as { statusCode: number }).statusCode = 400;
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('does NOT emit event for unknown routes', () => {
    const { req, res, next } = buildMocks({
      method: 'GET',
      path:   '/api/unknown/route',
    });
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('does NOT emit event when no authenticated user', () => {
    const { req, res, next } = buildMocks();
    delete (req as Record<string, unknown>)['user'];
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('emits REPORT_SUBMITTED event for POST /api/reports', () => {
    const { req, res, next } = buildMocks({
      method: 'POST',
      path:   '/api/reports',
    });
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'report_submitted' })
    );
  });

  it('emits BLOCK_CREATED event for POST /api/users/me/blocks', () => {
    const { req, res, next } = buildMocks({
      method: 'POST',
      path:   '/api/users/me/blocks',
    });
    analyticsMiddleware(req as Request, res as Response, next);
    (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'block_created' })
    );
  });

  it('does not throw if emitEvent throws', () => {
    mockEmit.mockImplementationOnce(() => { throw new Error('fail'); });
    const { req, res, next } = buildMocks({
      method: 'POST',
      path:   '/api/posts',
    });
    (res as unknown as { statusCode: number }).statusCode = 201;
    expect(() => {
      analyticsMiddleware(req as Request, res as Response, next);
      (res as unknown as { _triggerFinish: () => void })._triggerFinish();
    }).not.toThrow();
  });
});

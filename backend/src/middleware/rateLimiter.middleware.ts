import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';
import type { ErrorCode } from '../constants/errorCodes';
import {
  DAILY_POST_LIMIT,
  DAILY_REACTION_LIMIT,
  DAILY_CONVERSATION_REQUEST_LIMIT,
  ALIAS_ROTATION_RATE_LIMIT_HOURS,
  REPORT_RATE_LIMIT_PER_HOUR,
} from '../constants/limits';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeLimiter(options: {
  windowMs: number;
  max: number;
  errorCode: ErrorCode;
  message?: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    // Rate-limit by accountId (if authenticated) or IP as fallback
    keyGenerator: (req) => req.user?.accountId ?? req.ip ?? 'anonymous',
    handler: (_req, _res, next) => {
      next(new RateLimitError(options.errorCode, options.message));
    },
    skip: (_req) => process.env['NODE_ENV'] === 'test',
  });
}

/**
 * Generic factory for creating custom rate limiters.
 * Use for route-specific limiters that don't need a shared name.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  errorCode?: ErrorCode;
  message?: string;
}): RateLimitRequestHandler {
  const limiterOptions: Parameters<typeof makeLimiter>[0] = {
    windowMs:  options.windowMs,
    max:       options.max,
    errorCode: options.errorCode ?? 'ERR_RATE_LIMITED',
  };
  if (options.message !== undefined) {
    limiterOptions.message = options.message;
  }
  return makeLimiter(limiterOptions);
}

// ─── Named limiters ───────────────────────────────────────────────────────────

/** 1 post per 24-hour rolling window */
export const postRateLimiter = makeLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_POST_LIMIT,
  errorCode: 'ERR_DAILY_POST_LIMIT',
  message: 'You have reached your daily post limit. Come back tomorrow.',
});

/** 50 reactions per 24-hour rolling window */
export const reactionRateLimiter = makeLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_REACTION_LIMIT,
  errorCode: 'ERR_DAILY_REACTION_LIMIT',
  message: 'You have reached your daily reaction limit.',
});

/** 10 conversation requests per 24-hour rolling window */
export const conversationRateLimiter = makeLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_CONVERSATION_REQUEST_LIMIT,
  errorCode: 'ERR_DAILY_CONVERSATION_LIMIT',
  message: 'You have reached your daily conversation request limit.',
});

/** 1 alias rotation per 24-hour rolling window */
export const aliasRotationRateLimiter = makeLimiter({
  windowMs: ALIAS_ROTATION_RATE_LIMIT_HOURS * 60 * 60 * 1000,
  max: 1,
  errorCode: 'ERR_ALIAS_ROTATION_RATE_LIMITED',
  message: 'You can only rotate your alias once every 24 hours.',
});

/** 10 report submissions per hour */
export const reportRateLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  max: REPORT_RATE_LIMIT_PER_HOUR,
  errorCode: 'ERR_RATE_LIMITED',
  message: 'Too many reports submitted. Please wait before submitting more.',
});

/** General API rate limiter — 100 requests per 15 minutes (applied globally) */
export const globalRateLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  errorCode: 'ERR_RATE_LIMITED',
  message: 'Too many requests. Please slow down.',
});

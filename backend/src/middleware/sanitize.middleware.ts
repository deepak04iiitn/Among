import type { Request, Response, NextFunction } from 'express';

// ─── HTML tag stripping ───────────────────────────────────────────────────────
const HTML_TAG_REGEX = /<[^>]*>/g;
const MULTIPLE_NEWLINES_REGEX = /\n{3,}/g;
const LEADING_TRAILING_WHITESPACE_REGEX = /^\s+|\s+$/g;
const MULTIPLE_SPACES_REGEX = /[ \t]{2,}/g;

/**
 * Strips HTML tags and normalizes whitespace in a string value.
 * Preserves intentional single newlines (paragraph breaks).
 */
function sanitizeString(value: string): string {
  return value
    .replace(HTML_TAG_REGEX, '')              // Strip all HTML tags
    .replace(MULTIPLE_NEWLINES_REGEX, '\n\n') // Collapse 3+ newlines to 2
    .replace(MULTIPLE_SPACES_REGEX, ' ')      // Collapse multiple spaces/tabs
    .replace(LEADING_TRAILING_WHITESPACE_REGEX, ''); // Trim
}

/**
 * Recursively sanitizes all string values in an object.
 * Non-string values are passed through untouched.
 * Arrays are processed element-by-element.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

/**
 * sanitizeBody
 *
 * Middleware that strips HTML tags and normalizes whitespace in all string
 * fields of req.body. Applied globally to all routes accepting UGC.
 *
 * This is a defense-in-depth measure — output encoding in the frontend
 * is still the primary XSS defense.
 */
export function sanitizeBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body) as Record<string, unknown>;
  }
  next();
}

/**
 * Exported for use in service-layer validation when sanitizing
 * individual strings outside of the middleware pipeline.
 */
export { sanitizeString };

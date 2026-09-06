/**
 * hash.ts — One-way hashing utilities for privacy-safe analytics.
 *
 * Analytics events use HMAC-hashed account IDs so events can be
 * correlated per-user in analytics without exposing the raw account ID.
 */
import { createHmac } from 'crypto';

const ANALYTICS_HMAC_SECRET =
  process.env['ANALYTICS_HMAC_SECRET'] ?? 'AMONG_ANALYTICS_DEFAULT_SECRET';

/**
 * Returns a deterministic, privacy-safe hash of an account ID.
 * Used in analytics events only — never in product logic.
 */
export function hashAccountId(accountId: string): string {
  return createHmac('sha256', ANALYTICS_HMAC_SECRET)
    .update(accountId)
    .digest('hex');
}

/**
 * formatCount.ts — Utilities for formatting reaction counts for display.
 *
 * Privacy rule (PRD §6.2): counts below PRIVACY_THRESHOLD_MIN_GROUP_SIZE
 * must be masked — never show the exact number.
 *
 * Display rules:
 *  - < threshold  → "< {threshold}" (e.g. "< 100")
 *  - < 1,000      → exact number (e.g. "842")
 *  - < 10,000     → 1dp (e.g. "1.2k")
 *  - < 1,000,000  → 1dp k (e.g. "12.8k")
 *  - ≥ 1,000,000  → 1dp m (e.g. "1.4m")
 */
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../constants/limits';

/**
 * Format a raw reaction count for public display.
 * Always returns a compact, privacy-safe string.
 */
export function formatCount(count: number): string {
  if (count < 0) return '0';
  if (count < 1_000) return String(count);
  if (count < 10_000) return `${(count / 1_000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.floor(count / 1_000)}k`;
  return `${(count / 1_000_000).toFixed(1)}m`;
}

/**
 * Format a count with the privacy threshold applied.
 * If count is below PRIVACY_THRESHOLD_MIN_GROUP_SIZE, returns the masked string.
 */
export function formatPrivacySafeCount(
  count:     number,
  threshold: number = PRIVACY_THRESHOLD_MIN_GROUP_SIZE
): string {
  if (count < threshold) return `< ${threshold}`;
  return formatCount(count);
}

/**
 * Returns true when a count is below the privacy threshold.
 * Use this to decide whether to mask the count.
 */
export function isBelowPrivacyThreshold(
  count:     number,
  threshold: number = PRIVACY_THRESHOLD_MIN_GROUP_SIZE
): boolean {
  return count < threshold;
}

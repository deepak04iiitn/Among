/**
 * contentScanner.service.ts — Pre-publish automated content scanning.
 *
 * IMPORTANT: This runs synchronously before every post is published.
 * Patterns are defined in `backend/src/constants/contentPatterns.ts` — never inline.
 *
 * `hasCriticalViolations = true` → blocks publish.
 * `hasWarnings = true`           → allows publish, safety reminder shown.
 *
 * This service must NEVER throw — always return a ScanResult.
 */
import {
  CRITICAL_CONTENT_PATTERNS,
  WARNING_CONTENT_PATTERNS,
} from '../../constants/contentPatterns';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PatternType =
  | 'phone'
  | 'email'
  | 'socialHandle'
  | 'url'
  | 'contactSolicitation'
  | 'criticalContent';

export interface ScanResult {
  readonly hasCriticalViolations: boolean;
  readonly hasWarnings:           boolean;
  readonly detectedPatterns:      PatternType[];
}

// ─── Pattern type mapping ─────────────────────────────────────────────────────

// Map warning patterns (by index in WARNING_CONTENT_PATTERNS array) to a label
const WARNING_PATTERN_LABELS: readonly PatternType[] = [
  'phone',
  'email',
  'socialHandle',
  'url',
  'contactSolicitation',
] as const;

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Scan post body for policy violations and personal-information patterns.
 *
 * @param body — The raw post body text to scan.
 * @returns A `ScanResult` — always returns, never throws.
 */
export function scanPost(body: string): ScanResult {
  try {
    const detectedPatterns: PatternType[] = [];
    let hasCriticalViolations = false;
    let hasWarnings           = false;

    // ─── Critical violations ─────────────────────────────────────────────
    for (const pattern of CRITICAL_CONTENT_PATTERNS) {
      if (pattern.test(body)) {
        hasCriticalViolations = true;
        detectedPatterns.push('criticalContent');
        break; // One critical match is enough to block
      }
    }

    // ─── Warning patterns ─────────────────────────────────────────────────
    // Always run even if critical — to build a full picture for moderators
    for (let i = 0; i < WARNING_CONTENT_PATTERNS.length; i++) {
      const pattern = WARNING_CONTENT_PATTERNS[i];
      if (pattern && pattern.test(body)) {
        hasWarnings = true;
        const label = WARNING_PATTERN_LABELS[i];
        if (label && !detectedPatterns.includes(label)) {
          detectedPatterns.push(label);
        }
      }
    }

    return { hasCriticalViolations, hasWarnings, detectedPatterns };
  } catch {
    // Safety net — must never throw
    return { hasCriticalViolations: false, hasWarnings: false, detectedPatterns: [] };
  }
}

/**
 * crisisDetection.service.ts — Real-time crisis content detection.
 *
 * CRITICAL SAFETY RULES (from PRD §6.4):
 *  1. Crisis detection fires IMMEDIATELY and UNCONDITIONALLY when patterns match.
 *  2. It must NEVER throw — always return a safe result.
 *  3. Detection does NOT block or delay the post — it only sets the flag.
 *  4. The flag causes crisis resources to be surfaced to the user in the API response.
 *  5. General sadness, grief, or distress language must NOT trigger this.
 *
 * Pattern definitions live in `backend/src/constants/crisisPatterns.ts`.
 */
import { CRISIS_PATTERN_SETS } from '../../constants/crisisPatterns';
import type { CrisisType } from '../../constants/crisisResources';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CrisisResult {
  readonly isCrisis:   boolean;
  readonly crisisType: CrisisType | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Detect explicit crisis content in user-submitted text.
 *
 * Returns `{ isCrisis: true, crisisType }` if an explicit crisis pattern matches.
 * Returns `{ isCrisis: false, crisisType: null }` for all other content.
 *
 * @param text — The text to analyse (post body or message content).
 * @returns A `CrisisResult` — ALWAYS returns, NEVER throws.
 */
export function detectCrisisContent(text: string): CrisisResult {
  try {
    for (const { type, patterns } of CRISIS_PATTERN_SETS) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return { isCrisis: true, crisisType: type };
        }
      }
    }
    return { isCrisis: false, crisisType: null };
  } catch {
    // Must never throw — safety net
    return { isCrisis: false, crisisType: null };
  }
}

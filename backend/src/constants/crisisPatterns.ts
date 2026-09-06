// Backend-only — regex patterns for crisis content detection.
// CRITICAL RULE: These patterns must never throw. Detection must always return a result.
// Patterns are intentionally high-specificity to reduce false positives on general distress language.

import { CRISIS_TYPE, type CrisisType } from './crisisResources';

export interface CrisisPatternSet {
  readonly type: CrisisType;
  readonly patterns: readonly RegExp[];
}

/**
 * Patterns indicating explicit self-harm intent.
 * General sadness, distress, or past tense experiences must NOT match here.
 */
export const SELF_HARM_PATTERNS: readonly RegExp[] = [
  /\b(going to|want to|planning to|about to|will)\s+(kill|hurt|harm)\s+(my)?self\b/i,
  /\b(suicide|suicidal)\s+(plan|attempt|method|note)\b/i,
  /\b(end\s+my\s+life|take\s+my\s+own\s+life)\b/i,
  /\bnot\s+want\s+to\s+(be\s+here|exist|live)\s+anymore\b/i,
  /\b(overdose\s+on|methods?\s+(to|for)\s+(die|kill))\b/i,
];

/**
 * Patterns indicating explicit intent to harm others.
 */
export const HARM_TO_OTHERS_PATTERNS: readonly RegExp[] = [
  /\b(going to|want to|planning to|will)\s+(kill|hurt|harm|shoot|attack)\s+(him|her|them|someone|people)\b/i,
  /\b(have\s+a\s+(gun|weapon|knife))\s+and\s+(will|going\s+to)\b/i,
];

export const CRISIS_PATTERN_SETS: readonly CrisisPatternSet[] = [
  {
    type: CRISIS_TYPE.SELF_HARM,
    patterns: SELF_HARM_PATTERNS,
  },
  {
    type: CRISIS_TYPE.HARM_TO_OTHERS,
    patterns: HARM_TO_OTHERS_PATTERNS,
  },
];

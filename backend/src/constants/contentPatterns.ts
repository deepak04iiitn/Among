// Backend-only — regex patterns for pre-publish content scanning.
// Never define these patterns inline in the contentScanner service.

/**
 * Patterns that constitute CRITICAL violations — post is blocked from publishing.
 * Keep patterns specific enough to avoid false positives.
 */
export const CRITICAL_CONTENT_PATTERNS: readonly RegExp[] = [
  // Explicit illegal solicitation patterns (narrow, high-confidence only)
  /\b(buy|buys|buying|sell|sells|selling|purchase|purchases|purchasing)\s+(drugs?|cocaine|heroin|meth|fentanyl)\b/i,
  // CSAM references (any mention is critical)
  /\b(child\s+porn|cp\s+for\s+sale|underage\s+explicit)\b/i,
];

/**
 * Patterns that constitute WARNINGS — post is allowed but safety reminder shown.
 */
export const WARNING_CONTENT_PATTERNS: readonly RegExp[] = [
  // Phone numbers — various formats (10 digits min: NXX-NXX-XXXX or with country code)
  /(\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/,
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Social handles (@ preceded by non-word char or start of string)
  /(^|\s)@[a-zA-Z0-9_]{2,}/,
  // URLs
  /https?:\/\/[^\s]+/,
  // Explicit "contact me" solicitation
  /\b(dm\s+me|text\s+me|call\s+me|reach\s+me|message\s+me|whatsapp\s+me)\b/i,
];

/**
 * Patterns for detecting prohibited personal information in messages (soft-warning, not block).
 * Applied per-message in the messaging system.
 */
export const CONTACT_INFO_PATTERNS: Readonly<Record<string, RegExp>> = {
  phone: /(\+?\d[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})/,
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  socialHandle: /(^|\s)@[a-zA-Z0-9_]{2,}/,
  url: /https?:\/\/[^\s]+/,
};

export type ContactInfoPatternKey = keyof typeof CONTACT_INFO_PATTERNS;

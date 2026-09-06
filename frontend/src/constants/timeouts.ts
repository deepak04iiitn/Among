// Frontend-only — timeout and duration values in milliseconds (mirrored subset of backend).

// ─── Conversation timeouts ───────────────────────────────────────────────────
export const CONVERSATION_INACTIVITY_EXPIRY_MS = 30 * 60 * 1000;
export const CONVERSATION_MAX_DURATION_MS = 48 * 60 * 60 * 1000;
export const CONVERSATION_INACTIVITY_WARNING_MS = 25 * 60 * 1000;
export const CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS = 60 * 60 * 1000;
export const TRANSCRIPT_RETENTION_MS = 24 * 60 * 60 * 1000;

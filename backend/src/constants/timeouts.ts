// Backend-only — timeout and duration values in milliseconds.

// ─── Conversation timeouts ───────────────────────────────────────────────────
export const CONVERSATION_INACTIVITY_EXPIRY_MS = 30 * 60 * 1000;
export const CONVERSATION_MAX_DURATION_MS = 48 * 60 * 60 * 1000;
export const CONVERSATION_INACTIVITY_WARNING_MS = 25 * 60 * 1000;
export const CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS = 60 * 60 * 1000;
export const CONVERSATION_MAX_DURATION_WARNING_MS =
  CONVERSATION_MAX_DURATION_MS - CONVERSATION_MAX_DURATION_WARNING_BEFORE_MS;

// ─── Match request timeouts ──────────────────────────────────────────────────
export const MATCH_REQUEST_EXPIRY_MS = 15 * 60 * 1000;

// ─── Transcript retention ────────────────────────────────────────────────────
export const TRANSCRIPT_RETENTION_MS = 24 * 60 * 60 * 1000;

// ─── Post editing ────────────────────────────────────────────────────────────
export const POST_EDIT_WINDOW_MS = 15 * 60 * 1000;

// ─── API timeouts ────────────────────────────────────────────────────────────
export const API_REQUEST_TIMEOUT_MS = 10_000;

// ─── Cache TTLs ──────────────────────────────────────────────────────────────
export const FEED_CACHE_TTL_MS = 5 * 60 * 1000;
export const CONFIG_CACHE_TTL_MS = 60 * 1000;
export const FEATURE_FLAGS_CACHE_TTL_MS = 60 * 1000;

// ─── Session / alias ─────────────────────────────────────────────────────────
export const ALIAS_ROTATION_CYCLE_MS = 7 * 24 * 60 * 60 * 1000;
export const ALIAS_ROTATION_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

// ─── Job intervals ───────────────────────────────────────────────────────────
export const INACTIVITY_WARNING_JOB_INTERVAL_MS = 60 * 1000;
export const INACTIVITY_EXPIRY_JOB_INTERVAL_MS = 60 * 1000;
export const MAX_DURATION_EXPIRY_JOB_INTERVAL_MS = 5 * 60 * 1000;
export const MATCH_EXPIRY_JOB_INTERVAL_MS = 60 * 1000;

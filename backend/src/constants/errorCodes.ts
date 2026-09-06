// MIRRORED — keep in sync with frontend/src/constants/errorCodes.ts

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const ERR_UNAUTHORIZED = 'ERR_UNAUTHORIZED';
export const ERR_FORBIDDEN = 'ERR_FORBIDDEN';
export const ERR_TOKEN_EXPIRED = 'ERR_TOKEN_EXPIRED';
export const ERR_TOKEN_INVALID = 'ERR_TOKEN_INVALID';
export const ERR_ACCOUNT_BANNED = 'ERR_ACCOUNT_BANNED';
export const ERR_ACCOUNT_RESTRICTED = 'ERR_ACCOUNT_RESTRICTED';
export const ERR_ONBOARDING_REQUIRED = 'ERR_ONBOARDING_REQUIRED';

// ─── Validation ───────────────────────────────────────────────────────────────
export const ERR_VALIDATION = 'ERR_VALIDATION';
export const ERR_INVALID_INPUT = 'ERR_INVALID_INPUT';

// ─── Resources ────────────────────────────────────────────────────────────────
export const ERR_NOT_FOUND = 'ERR_NOT_FOUND';
export const ERR_POST_NOT_FOUND = 'ERR_POST_NOT_FOUND';
export const ERR_CONVERSATION_NOT_FOUND = 'ERR_CONVERSATION_NOT_FOUND';
export const ERR_USER_NOT_FOUND = 'ERR_USER_NOT_FOUND';

// ─── Permissions ──────────────────────────────────────────────────────────────
export const ERR_NOT_PARTICIPANT = 'ERR_NOT_PARTICIPANT';
export const ERR_NOT_AUTHOR = 'ERR_NOT_AUTHOR';
export const ERR_INSUFFICIENT_ROLE = 'ERR_INSUFFICIENT_ROLE';

// ─── Rate limits ──────────────────────────────────────────────────────────────
export const ERR_RATE_LIMITED = 'ERR_RATE_LIMITED';
export const ERR_DAILY_POST_LIMIT = 'ERR_DAILY_POST_LIMIT';
export const ERR_DAILY_REACTION_LIMIT = 'ERR_DAILY_REACTION_LIMIT';
export const ERR_DAILY_CONVERSATION_LIMIT = 'ERR_DAILY_CONVERSATION_LIMIT';
export const ERR_ALIAS_ROTATION_RATE_LIMITED = 'ERR_ALIAS_ROTATION_RATE_LIMITED';

// ─── Posts ────────────────────────────────────────────────────────────────────
export const ERR_POST_EDIT_WINDOW_EXPIRED = 'ERR_POST_EDIT_WINDOW_EXPIRED';
export const ERR_CONTENT_VIOLATION = 'ERR_CONTENT_VIOLATION';
export const ERR_POST_DELETED = 'ERR_POST_DELETED';

// ─── Conversations ────────────────────────────────────────────────────────────
export const ERR_CONVERSATION_ENDED = 'ERR_CONVERSATION_ENDED';
export const ERR_CONVERSATION_NOT_ACTIVE = 'ERR_CONVERSATION_NOT_ACTIVE';
export const ERR_ACTIVE_CONVERSATION_EXISTS = 'ERR_ACTIVE_CONVERSATION_EXISTS';
export const ERR_NO_MATCH_FOUND = 'ERR_NO_MATCH_FOUND';
export const ERR_MATCH_REQUEST_EXPIRED = 'ERR_MATCH_REQUEST_EXPIRED';

// ─── Moderation ───────────────────────────────────────────────────────────────
export const ERR_ALREADY_BLOCKED = 'ERR_ALREADY_BLOCKED';
export const ERR_CANNOT_BLOCK_SELF = 'ERR_CANNOT_BLOCK_SELF';

// ─── Server ───────────────────────────────────────────────────────────────────
export const ERR_INTERNAL = 'ERR_INTERNAL';
export const ERR_SERVICE_UNAVAILABLE = 'ERR_SERVICE_UNAVAILABLE';

export const ERROR_CODES = {
  ERR_UNAUTHORIZED, ERR_FORBIDDEN, ERR_TOKEN_EXPIRED, ERR_TOKEN_INVALID,
  ERR_ACCOUNT_BANNED, ERR_ACCOUNT_RESTRICTED, ERR_ONBOARDING_REQUIRED,
  ERR_VALIDATION, ERR_INVALID_INPUT,
  ERR_NOT_FOUND, ERR_POST_NOT_FOUND, ERR_CONVERSATION_NOT_FOUND, ERR_USER_NOT_FOUND,
  ERR_NOT_PARTICIPANT, ERR_NOT_AUTHOR, ERR_INSUFFICIENT_ROLE,
  ERR_RATE_LIMITED, ERR_DAILY_POST_LIMIT, ERR_DAILY_REACTION_LIMIT,
  ERR_DAILY_CONVERSATION_LIMIT, ERR_ALIAS_ROTATION_RATE_LIMITED,
  ERR_POST_EDIT_WINDOW_EXPIRED, ERR_CONTENT_VIOLATION, ERR_POST_DELETED,
  ERR_CONVERSATION_ENDED, ERR_CONVERSATION_NOT_ACTIVE, ERR_ACTIVE_CONVERSATION_EXISTS,
  ERR_NO_MATCH_FOUND, ERR_MATCH_REQUEST_EXPIRED,
  ERR_ALREADY_BLOCKED, ERR_CANNOT_BLOCK_SELF,
  ERR_INTERNAL, ERR_SERVICE_UNAVAILABLE,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

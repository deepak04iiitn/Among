// MIRRORED — keep in sync with backend/src/constants/limits.ts

export const POST_MIN_CHARS = 20;
export const POST_MAX_CHARS = 3000;
export const RESPONSE_MAX_CHARS = 1000;
export const POST_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const POST_CATEGORY_MIN = 1;
export const POST_CATEGORY_MAX = 3;
export const THINGS_I_CANT_SAY_CATEGORY_MIN = 0;
export const DAILY_POST_LIMIT = 1;
export const DAILY_REACTION_LIMIT = 50;
export const DAILY_CONVERSATION_REQUEST_LIMIT = 10;
export const MESSAGE_MAX_CHARS = 1000;
export const ONBOARDING_CATEGORY_MIN = 3;
export const ONBOARDING_CATEGORY_MAX = 5;
export const SECONDARY_DISCOVERY_ITEMS = 5;
export const CATEGORY_PAGE_BATCH_SIZE = 20;
export const MAX_SNY_PROMPTS_PER_DAY = 1;
export const DAILY_SNY_SKIP_LIMIT = 3;
export const ALIAS_ROTATION_RATE_LIMIT_HOURS = 24;
export const ALIAS_ROTATION_CYCLE_DAYS = 7;
export const PRIVACY_THRESHOLD_MIN_GROUP_SIZE = 100;
export const MAX_SAVED_POSTS = 500;

/** Characters remaining threshold before the counter becomes visible in compose */
export const COMPOSE_COUNTER_VISIBLE_THRESHOLD = 200;

// MIRRORED — keep in sync with backend/src/constants/conversationStates.ts

export const CONVERSATION_STATE = {
  REQUESTED: 'requested',
  MATCHED_PENDING: 'matched_pending',
  ACTIVE: 'active',
  INACTIVITY_WARNING: 'inactivity_warning',
  ENDED_BY_USER: 'ended_by_user',
  ENDED_INACTIVITY: 'ended_inactivity',
  ENDED_MAX_DURATION: 'ended_max_duration',
  ENDED_MODERATION: 'ended_moderation',
  NO_MATCH_FOUND: 'no_match_found',
} as const;

export type ConversationState = (typeof CONVERSATION_STATE)[keyof typeof CONVERSATION_STATE];

export const ACTIVE_CONVERSATION_STATES: ReadonlySet<ConversationState> = new Set([
  CONVERSATION_STATE.MATCHED_PENDING,
  CONVERSATION_STATE.ACTIVE,
  CONVERSATION_STATE.INACTIVITY_WARNING,
]);

export const ENDED_CONVERSATION_STATES: ReadonlySet<ConversationState> = new Set([
  CONVERSATION_STATE.ENDED_BY_USER,
  CONVERSATION_STATE.ENDED_INACTIVITY,
  CONVERSATION_STATE.ENDED_MAX_DURATION,
  CONVERSATION_STATE.ENDED_MODERATION,
  CONVERSATION_STATE.NO_MATCH_FOUND,
]);

export const TRANSCRIPT_VISIBLE_STATES: ReadonlySet<ConversationState> = new Set([
  CONVERSATION_STATE.ENDED_BY_USER,
  CONVERSATION_STATE.ENDED_INACTIVITY,
  CONVERSATION_STATE.ENDED_MAX_DURATION,
]);

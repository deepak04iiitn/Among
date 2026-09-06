/**
 * analyticsEvents.ts — All analytics event type constants.
 *
 * Product code never emits raw strings — always import from here.
 * Analytics rules (PRD §18):
 *  - Never include Firebase UID, email, raw accountId, or message body.
 *  - accountIdHash is always an HMAC — never the raw ID.
 *  - Events are fire-and-forget — never block user-facing requests.
 */

export const ANALYTICS_EVENT = {
  // User lifecycle
  USER_CREATED:           'user_created',
  FIRST_POST_CREATED:     'first_post_created',

  // Content
  POST_CREATED:           'post_created',
  POST_DELETED:           'post_deleted',

  // Reactions
  REACTION_SET:           'reaction_set',
  REACTION_REMOVED:       'reaction_removed',

  // Conversations
  CONVERSATION_REQUESTED: 'conversation_requested',
  CONVERSATION_MATCHED:   'conversation_matched',
  CONVERSATION_STARTED:   'conversation_started',
  CONVERSATION_ENDED:     'conversation_ended',

  // SNY
  SNY_PROMPT_SHOWN:       'sny_prompt_shown',
  SNY_PROMPT_ACCEPTED:    'sny_prompt_accepted',
  SNY_PROMPT_SKIPPED:     'sny_prompt_skipped',

  // Safety
  REPORT_SUBMITTED:       'report_submitted',
  BLOCK_CREATED:          'block_created',
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

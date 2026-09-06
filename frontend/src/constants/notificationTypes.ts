// MIRRORED — keep in sync with backend/src/constants/notificationTypes.ts

export const NOTIFICATION_TYPE = {
  REACTION_ON_POST:  'reaction_on_post',
  SNY_PROMPT:        'sny_prompt',
  NEW_MESSAGE:       'new_message',
  EXPIRY_WARNING:    'expiry_warning',
  MODERATION_ACTION: 'moderation_action',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE) as NotificationType[];

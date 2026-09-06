// MIRRORED — keep in sync with backend/src/constants/notificationTypes.ts

export const NOTIFICATION_TYPE = {
  REACTION_ON_POST:  'reaction_on_post',
  SNY_PROMPT:        'sny_prompt',
  NEW_MESSAGE:       'new_message',
  EXPIRY_WARNING:    'expiry_warning',
  MODERATION_ACTION: 'moderation_action',
  SYSTEM:            'system',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE) as NotificationType[];

export const NOTIFICATION_REFERENCE_TYPE = {
  POST:         'post',
  CONVERSATION: 'conversation',
  ACCOUNT:      'account',
} as const;

export type NotificationReferenceType =
  (typeof NOTIFICATION_REFERENCE_TYPE)[keyof typeof NOTIFICATION_REFERENCE_TYPE];

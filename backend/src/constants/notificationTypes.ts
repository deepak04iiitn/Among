// MIRRORED — keep in sync with frontend/src/constants/notificationTypes.ts
// Backend notification type definitions.

export const NOTIFICATION_TYPE = {
  REACTION_ON_POST:     'reaction_on_post',
  SNY_PROMPT:           'sny_prompt',
  NEW_MESSAGE:          'new_message',
  EXPIRY_WARNING:       'expiry_warning',
  MODERATION_ACTION:    'moderation_action',
  SYSTEM:               'system',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE) as NotificationType[];

/**
 * Generic lock-screen safe text — NEVER contains message content, aliases, or PII.
 * Used for push/email previews.
 */
export const NOTIFICATION_GENERIC_TEXT: Readonly<Record<NotificationType, string>> = {
  [NOTIFICATION_TYPE.REACTION_ON_POST]:  'Someone responded to your experience on AMONG.',
  [NOTIFICATION_TYPE.SNY_PROMPT]:        'Someone may need your support today on AMONG.',
  [NOTIFICATION_TYPE.NEW_MESSAGE]:       'You have a new message on AMONG.',
  [NOTIFICATION_TYPE.EXPIRY_WARNING]:    'Your conversation on AMONG is about to end.',
  [NOTIFICATION_TYPE.MODERATION_ACTION]: 'There is an update to your account on AMONG.',
  [NOTIFICATION_TYPE.SYSTEM]:            'You have a notification on AMONG.',
} as const;

export const NOTIFICATION_REFERENCE_TYPE = {
  POST:         'post',
  CONVERSATION: 'conversation',
  ACCOUNT:      'account',
} as const;

export type NotificationReferenceType =
  (typeof NOTIFICATION_REFERENCE_TYPE)[keyof typeof NOTIFICATION_REFERENCE_TYPE];

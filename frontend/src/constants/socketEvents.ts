// MIRRORED — keep in sync with backend/src/constants/socketEvents.ts

export const SERVER_SOCKET_EVENT = {
  MESSAGE_RECEIVED: 'server:message_received',
  CONVERSATION_STATE_CHANGED: 'server:conversation_state_changed',
  EXPIRY_WARNING: 'server:expiry_warning',
  CONTACT_INFO_WARNING: 'server:contact_info_warning',
  MATCH_FOUND: 'server:match_found',
  MATCH_EXPIRED: 'server:match_expired',
} as const;

export type ServerSocketEvent =
  (typeof SERVER_SOCKET_EVENT)[keyof typeof SERVER_SOCKET_EVENT];

export const CLIENT_SOCKET_EVENT = {
  JOIN_CONVERSATION: 'client:join_conversation',
  LEAVE_CONVERSATION: 'client:leave_conversation',
  SEND_MESSAGE: 'client:send_message',
  END_CONVERSATION: 'client:end_conversation',
} as const;

export type ClientSocketEvent =
  (typeof CLIENT_SOCKET_EVENT)[keyof typeof CLIENT_SOCKET_EVENT];

export const EXPIRY_WARNING_TYPE = {
  INACTIVITY: 'inactivity',
  MAX_DURATION: 'max_duration',
} as const;

export type ExpiryWarningType =
  (typeof EXPIRY_WARNING_TYPE)[keyof typeof EXPIRY_WARNING_TYPE];

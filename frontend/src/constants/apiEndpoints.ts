// Frontend-only — all API endpoint paths.
// Never construct endpoint strings inline in components, hooks, or thunks.

const BASE = '/api';

export const API = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  AUTH_SESSION:  `${BASE}/auth/session`,
  AUTH_REFRESH:  `${BASE}/auth/refresh`,
  AUTH_REGISTER: `${BASE}/auth/register`,
  AUTH_LOGIN:    `${BASE}/auth/login`,

  // ─── Users ──────────────────────────────────────────────────────────────────
  USERS_ME: `${BASE}/users/me`,
  USERS_ME_ONBOARDING: `${BASE}/users/me/onboarding`,
  USERS_ME_ALIAS_ROTATE: `${BASE}/users/me/alias/rotate`,
  USERS_ME_CATEGORIES: `${BASE}/users/me/categories`,
  USERS_ME_SETTINGS: `${BASE}/users/me/settings`,
  USERS_ME_SETTINGS_NOTIFICATIONS: `${BASE}/users/me/settings/notifications`,
  USERS_ME_SETTINGS_SNY: `${BASE}/users/me/settings/sny`,
  USERS_ME_EXPORT: `${BASE}/users/me/export`,
  USERS_ME_DELETE: `${BASE}/users/me`,
  USERS_ME_BLOCKS: `${BASE}/users/me/blocks`,
  USERS_ME_BLOCK: (accountId: string) => `${BASE}/users/me/blocks/${accountId}`,
  USERS_ME_SAVED: `${BASE}/users/me/saved`,
  USERS_ME_YOU_ARE_NOT_ALONE: `${BASE}/users/me/you-are-not-alone`,

  // ─── Posts ──────────────────────────────────────────────────────────────────
  POSTS: `${BASE}/posts`,
  POST: (id: string) => `${BASE}/posts/${id}`,
  POST_REACTIONS: (postId: string) => `${BASE}/posts/${postId}/reactions`,
  POST_SAVED: (postId: string) => `${BASE}/posts/${postId}/saved`,
  POST_SIMILAR: (postId: string) => `${BASE}/posts/${postId}/similar`,
  POSTS_MY: `${BASE}/posts/my`,

  // ─── Discovery ──────────────────────────────────────────────────────────────
  DISCOVERY_FEED: `${BASE}/discovery/feed`,
  DISCOVERY_CATEGORY: (slug: string) => `${BASE}/discovery/category/${slug}`,

  // ─── Conversations ──────────────────────────────────────────────────────────
  CONVERSATIONS: `${BASE}/conversations`,
  CONVERSATION_REQUEST: `${BASE}/conversations/request`,
  CONVERSATION: (id: string) => `${BASE}/conversations/${id}`,
  CONVERSATION_CANCEL: (id: string) => `${BASE}/conversations/${id}/request`,
  CONVERSATION_END: (id: string) => `${BASE}/conversations/${id}/end`,
  CONVERSATION_FEEDBACK: (id: string) => `${BASE}/conversations/${id}/feedback`,
  CONVERSATION_MESSAGES: (id: string) => `${BASE}/conversations/${id}/messages`,

  // ─── Someone Needs You ──────────────────────────────────────────────────────
  SNY_PROMPT: `${BASE}/sny/prompt`,
  SNY_SKIP: `${BASE}/sny/skip`,
  SNY_ACCEPT: `${BASE}/sny/accept`,

  // ─── Notifications ──────────────────────────────────────────────────────────
  NOTIFICATIONS: `${BASE}/notifications`,
  NOTIFICATIONS_READ_ALL: `${BASE}/notifications/read-all`,
  NOTIFICATION_READ: (id: string) => `${BASE}/notifications/${id}/read`,

  // ─── Reports ────────────────────────────────────────────────────────────────
  REPORTS: `${BASE}/reports`,

  // ─── Admin ──────────────────────────────────────────────────────────────────
  ADMIN_REPORTS: `${BASE}/admin/reports`,
  ADMIN_REPORT: (id: string) => `${BASE}/admin/reports/${id}`,
  ADMIN_REPORT_ACTION: (id: string) => `${BASE}/admin/reports/${id}/action`,
  ADMIN_USER: (id: string) => `${BASE}/admin/users/${id}`,
  ADMIN_USER_ACTION: (id: string) => `${BASE}/admin/users/${id}/action`,
  ADMIN_METRICS: `${BASE}/admin/analytics/metrics`,
  ADMIN_SAFETY_METRICS: `${BASE}/admin/analytics/safety`,
  ADMIN_CATEGORY_METRICS: `${BASE}/admin/analytics/categories`,
  ADMIN_CONFIG_RANKING: `${BASE}/admin/config/ranking-weights`,
  ADMIN_CONFIG_RATE_LIMITS: `${BASE}/admin/config/rate-limits`,
  ADMIN_CONFIG_FLAGS: `${BASE}/admin/config/feature-flags`,
  ADMIN_CONFIG_FLAG: (flag: string) => `${BASE}/admin/config/feature-flags/${flag}`,
} as const;

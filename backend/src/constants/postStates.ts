// MIRRORED — keep in sync with frontend/src/constants/postStates.ts

export const POST_STATUS = {
  PUBLISHED: 'published',
  DELETED_BY_USER: 'deleted_by_user',
  REMOVED_BY_MODERATION: 'removed_by_moderation',
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const POST_EXPERIENCE_STATE = {
  CURRENT: 'current',
  PAST: 'past',
  EXPLORATORY: 'exploratory',
} as const;

export type PostExperienceState =
  (typeof POST_EXPERIENCE_STATE)[keyof typeof POST_EXPERIENCE_STATE];

export const POST_VISIBILITY = {
  BROAD: 'broad',
  FOCUSED: 'focused',
  PRIVATE: 'private',
} as const;

export type PostVisibility = (typeof POST_VISIBILITY)[keyof typeof POST_VISIBILITY];

export const VISIBLE_POST_STATUSES: ReadonlySet<PostStatus> = new Set([POST_STATUS.PUBLISHED]);

export const REMOVED_POST_STATUSES: ReadonlySet<PostStatus> = new Set([
  POST_STATUS.DELETED_BY_USER,
  POST_STATUS.REMOVED_BY_MODERATION,
]);

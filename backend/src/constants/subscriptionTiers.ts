// Backend-only — subscription tier and entitlement definitions.
// NOTE: No subscription product in MVP. All users are FREE.
// This file exists so entitlement checks can be added now and enabled later.

export const SUBSCRIPTION_TIER = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export interface Entitlements {
  readonly canAccessPremiumMatching: boolean;
  readonly canAccessConversationHistory: boolean;
  readonly canAccessExperienceTimeline: boolean;
  readonly canAccessPremiumConversations: boolean;
}

/** All entitlements false in MVP */
export const FREE_TIER_ENTITLEMENTS: Entitlements = {
  canAccessPremiumMatching: false,
  canAccessConversationHistory: false,
  canAccessExperienceTimeline: false,
  canAccessPremiumConversations: false,
} as const;

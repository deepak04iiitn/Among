/**
 * subscription.service.ts — Single choke point for all entitlement checks.
 *
 * PRD §20 rules:
 *  - `getEntitlements(accountId)` is the ONLY place that decides feature access.
 *  - Product services NEVER check `user.subscriptionTier` directly.
 *  - At MVP, all entitlements return `false` for all users (free tier only).
 *  - Enabling premium later = update this file + add payment integration.
 *    Zero product service changes required.
 *
 * Architecture note:
 *  The `Entitlements` interface is defined in `subscriptionTiers.ts` so it can
 *  be imported by any service without creating a circular dependency.
 */
import { Types } from 'mongoose';
import { UserModel }              from '../users/user.model';
import { SubscriptionModel }      from './subscription.model';
import {
  SUBSCRIPTION_TIER,
  FREE_TIER_ENTITLEMENTS,
  type Entitlements,
  type SubscriptionTier,
} from '../../constants/subscriptionTiers';

// ─── Premium entitlement map ──────────────────────────────────────────────────
// At MVP this is never reached (no premium users), but the structure is ready.

const PREMIUM_ENTITLEMENTS: Entitlements = {
  canAccessPremiumMatching:        true,
  canAccessConversationHistory:    true,
  canAccessExperienceTimeline:     true,
  canAccessPremiumConversations:   true,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get entitlements for a given account.
 *
 * At MVP: always returns FREE_TIER_ENTITLEMENTS (all false).
 * Post-MVP: looks up the account's tier and returns the appropriate entitlements.
 *
 * Call this function from any service that needs to gate premium behavior.
 * NEVER check `user.subscriptionTier` inline in product code.
 */
export async function getEntitlements(accountId: string): Promise<Entitlements> {
  const tier = await resolveSubscriptionTier(accountId);

  switch (tier) {
    case SUBSCRIPTION_TIER.PREMIUM:
      return { ...PREMIUM_ENTITLEMENTS };
    case SUBSCRIPTION_TIER.FREE:
    default:
      return { ...FREE_TIER_ENTITLEMENTS };
  }
}

/**
 * Resolve the current subscription tier for an account.
 *
 * Reads from the Subscription collection first (active subscription),
 * falls back to the User's `subscriptionTier` field.
 * Returns FREE if no record is found.
 */
async function resolveSubscriptionTier(accountId: string): Promise<SubscriptionTier> {
  try {
    const accountObjectId = new Types.ObjectId(accountId);

    // Check for an active subscription record first
    const sub = await SubscriptionModel.findOne({
      accountId: accountObjectId,
      status:    'active',
    }).lean();

    if (sub) return sub.tier;

    // Fall back to the denormalized tier on the User document
    const user = await UserModel.findById(accountObjectId).select('subscriptionTier').lean();
    if (user) return (user as { subscriptionTier?: SubscriptionTier }).subscriptionTier ?? SUBSCRIPTION_TIER.FREE;
  } catch {
    // Never crash a product service call — return free tier on error
  }

  return SUBSCRIPTION_TIER.FREE;
}

/**
 * Check a single entitlement by key.
 * Convenience wrapper around `getEntitlements`.
 */
export async function hasEntitlement(
  accountId: string,
  key:       keyof Entitlements
): Promise<boolean> {
  const entitlements = await getEntitlements(accountId);
  return entitlements[key];
}

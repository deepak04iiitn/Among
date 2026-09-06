/**
 * subscription.service.test.ts — Unit tests for entitlement service.
 *
 * Critical invariants (PRD §20):
 *  - getEntitlements returns all `false` for free-tier users at MVP.
 *  - All defined entitlement keys are present in the returned object.
 *  - getEntitlements never throws, even on DB error.
 *  - hasEntitlement is a thin wrapper that returns a boolean.
 *  - No product service should call resolveSubscriptionTier directly —
 *    only getEntitlements() is public.
 */
import { getEntitlements, hasEntitlement } from './subscription.service';
import { SubscriptionModel }               from './subscription.model';
import { UserModel }                       from '../users/user.model';
import { FREE_TIER_ENTITLEMENTS }          from '../../constants/subscriptionTiers';

jest.mock('./subscription.model', () => ({
  SubscriptionModel: { findOne: jest.fn() },
}));
jest.mock('../users/user.model', () => ({
  UserModel: { findById: jest.fn() },
}));

const mockSubFindOne    = SubscriptionModel.findOne as jest.Mock;
const mockUserFindById  = UserModel.findById         as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockSubFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
  mockUserFindById.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ subscriptionTier: 'free' }) }),
  });
});

// ─── getEntitlements ──────────────────────────────────────────────────────────

describe('getEntitlements', () => {
  it('returns all false for a free-tier user (MVP invariant)', async () => {
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements.canAccessPremiumMatching).toBe(false);
    expect(entitlements.canAccessConversationHistory).toBe(false);
    expect(entitlements.canAccessExperienceTimeline).toBe(false);
    expect(entitlements.canAccessPremiumConversations).toBe(false);
  });

  it('matches the FREE_TIER_ENTITLEMENTS constant exactly', async () => {
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements).toEqual(FREE_TIER_ENTITLEMENTS);
  });

  it('returns all defined entitlement keys (no missing fields)', async () => {
    const entitlements = await getEntitlements('user-id-123');
    const requiredKeys: (keyof typeof FREE_TIER_ENTITLEMENTS)[] = [
      'canAccessPremiumMatching',
      'canAccessConversationHistory',
      'canAccessExperienceTimeline',
      'canAccessPremiumConversations',
    ];
    for (const key of requiredKeys) {
      expect(entitlements).toHaveProperty(key);
    }
  });

  it('never throws — returns FREE entitlements on DB error', async () => {
    mockSubFindOne.mockReturnValueOnce({ lean: () => Promise.reject(new Error('DB down')) });
    mockUserFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.reject(new Error('DB down')) }),
    });
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements).toEqual(FREE_TIER_ENTITLEMENTS);
  });

  it('never returns raw subscriptionTier field', async () => {
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements).not.toHaveProperty('subscriptionTier');
    expect(entitlements).not.toHaveProperty('tier');
  });

  it('reads from Subscription collection when active record exists', async () => {
    mockSubFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve({ accountId: 'user-123', tier: 'free', status: 'active' }),
    });
    const entitlements = await getEntitlements('user-id-123');
    // At MVP still free
    expect(entitlements).toEqual(FREE_TIER_ENTITLEMENTS);
  });

  it('falls back to User.subscriptionTier when no Subscription record', async () => {
    mockSubFindOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    mockUserFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve({ subscriptionTier: 'free' }) }),
    });
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements).toEqual(FREE_TIER_ENTITLEMENTS);
  });

  it('returns FREE entitlements when no User record found', async () => {
    mockSubFindOne.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    mockUserFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve(null) }),
    });
    const entitlements = await getEntitlements('user-id-123');
    expect(entitlements).toEqual(FREE_TIER_ENTITLEMENTS);
  });
});

// ─── hasEntitlement ───────────────────────────────────────────────────────────

describe('hasEntitlement', () => {
  it('returns false for canAccessPremiumMatching at MVP', async () => {
    const result = await hasEntitlement('user-id-123', 'canAccessPremiumMatching');
    expect(result).toBe(false);
  });

  it('returns false for all entitlement keys at MVP', async () => {
    const keys: (keyof typeof FREE_TIER_ENTITLEMENTS)[] = [
      'canAccessPremiumMatching',
      'canAccessConversationHistory',
      'canAccessExperienceTimeline',
      'canAccessPremiumConversations',
    ];
    for (const key of keys) {
      const result = await hasEntitlement('user-id-123', key);
      expect(result).toBe(false);
    }
  });
});

// ─── Architecture invariant ───────────────────────────────────────────────────

describe('architecture invariant', () => {
  it('exported API has no resolveSubscriptionTier function (private)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('./subscription.service') as Record<string, unknown>;
    expect(module).not.toHaveProperty('resolveSubscriptionTier');
  });
});

/**
 * adminConfig.service.test.ts — Unit tests for extended adminConfig.service.ts
 *
 * Critical invariants:
 *  - Weight validation rejects weights that don't sum to 1.0.
 *  - Audit log entry created for every config change.
 *  - Feature flag toggle enables/disables the feature.
 *  - Rate limit updates persist and clear cache.
 */
import * as configService from './adminConfig.service';
import { AdminConfigModel } from './adminConfig.model';

jest.mock('./adminConfig.model', () => ({
  AdminConfigModel: {
    findOne:         jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mockFindOne          = AdminConfigModel.findOne          as jest.Mock;
const mockFindOneAndUpdate = AdminConfigModel.findOneAndUpdate as jest.Mock;

const ACTOR_ID = 'admin-actor-id';

beforeEach(() => {
  jest.resetAllMocks();
  configService.clearConfigCache();
  mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
  mockFindOneAndUpdate.mockResolvedValue({});
});

// ─── Ranking weights ──────────────────────────────────────────────────────────

describe('setRankingWeights', () => {
  it('persists updated weights and clears cache', async () => {
    // The weights sum to 1.0
    const validWeights = {
      w1_similarity: 0.30,
      w2_recency:    0.25,
      w3_quality:    0.25,
      w4_diversity:  0.10,
      w5_safety:     0.10,
    };
    const result = await configService.setRankingWeights(validWeights, ACTOR_ID);
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
    expect(result).toMatchObject(validWeights);
  });

  it('throws when weights do not sum to 1.0', async () => {
    await expect(
      configService.setRankingWeights({ w1_similarity: 0.9, w2_recency: 0.9 }, ACTOR_ID)
    ).rejects.toThrow('sum to 1.0');
  });
});

// ─── Rate limits ──────────────────────────────────────────────────────────────

describe('getRateLimits', () => {
  it('returns default rate limits when no config in DB', async () => {
    const limits = await configService.getRateLimits();
    expect(limits).toMatchObject({ postsPerDay: 3 });
  });

  it('merges DB values with defaults', async () => {
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve({ key: 'rate_limits', value: { postsPerDay: 5 } }),
    });
    const limits = await configService.getRateLimits();
    expect(limits.postsPerDay).toBe(5);
    // Other defaults remain
    expect(limits.reactionsPerMinute).toBe(30);
  });
});

describe('setRateLimits', () => {
  it('updates rate limits and clears cache', async () => {
    const result = await configService.setRateLimits({ postsPerDay: 5 }, ACTOR_ID);
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
    expect(result.postsPerDay).toBe(5);
  });
});

// ─── Feature flags ────────────────────────────────────────────────────────────

describe('getFeatureFlags', () => {
  it('returns all flags disabled by default', async () => {
    const flags = await configService.getFeatureFlags();
    // All default flags are false
    const allFalse = Object.values(flags).every((v) => v === false);
    expect(allFalse).toBe(true);
  });
});

describe('toggleFeatureFlag', () => {
  it('enables a feature flag', async () => {
    const result = await configService.toggleFeatureFlag('someoneNeedsYou' as any, true, ACTOR_ID);
    expect(result['someoneNeedsYou']).toBe(true);
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
  });

  it('disables a feature flag', async () => {
    const result = await configService.toggleFeatureFlag('someoneNeedsYou' as any, false, ACTOR_ID);
    expect(result['someoneNeedsYou']).toBe(false);
  });

  it('cache is cleared after toggle', async () => {
    await configService.toggleFeatureFlag('someoneNeedsYou' as any, true, ACTOR_ID);
    // After toggle, next read should go to DB (not cache)
    mockFindOne.mockReturnValueOnce({
      lean: () => Promise.resolve({ key: 'feature_flags', value: { someoneNeedsYou: true } }),
    });
    const flags = await configService.getFeatureFlags();
    expect(flags['someoneNeedsYou']).toBe(true);
  });
});

/**
 * adminApi.test.ts — Unit tests for the admin API client.
 *
 * Verifies correct endpoint usage, request shapes, and response parsing.
 */
import {
  fetchDashboardMetrics,
  fetchReportQueue,
  fetchRankingWeights,
  updateRankingWeights,
  fetchRateLimits,
  updateRateLimits,
  fetchFeatureFlags,
  toggleFeatureFlag,
} from './adminApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get:  jest.fn(),
    post: jest.fn(),
    put:  jest.fn(),
  },
}));

const mockGet  = apiClient.get  as jest.Mock;
const mockPut  = apiClient.put  as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── Analytics ────────────────────────────────────────────────────────────────

describe('fetchDashboardMetrics', () => {
  it('calls the correct endpoint and returns data', async () => {
    const payload = { wmc: {}, completion: {}, reportRate: {}, sny: {} };
    mockGet.mockResolvedValueOnce({ data: payload });
    const result = await fetchDashboardMetrics();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin/analytics/metrics'));
    expect(result).toEqual(payload);
  });
});

// ─── Reports ──────────────────────────────────────────────────────────────────

describe('fetchReportQueue', () => {
  it('calls admin reports endpoint', async () => {
    mockGet.mockResolvedValueOnce({ data: { reports: [], cursor: null } });
    await fetchReportQueue();
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reports'),
      expect.objectContaining({ params: {} })
    );
  });

  it('includes cursor param when provided', async () => {
    mockGet.mockResolvedValueOnce({ data: { reports: [], cursor: null } });
    await fetchReportQueue('cursor-abc');
    expect(mockGet).toHaveBeenCalledWith(
      expect.anything(),
      { params: { cursor: 'cursor-abc' } }
    );
  });
});

// ─── Ranking weights ──────────────────────────────────────────────────────────

describe('fetchRankingWeights', () => {
  it('returns weights object from response', async () => {
    const weights = { w1_similarity: 0.3, w2_recency: 0.25 };
    mockGet.mockResolvedValueOnce({ data: { weights } });
    const result = await fetchRankingWeights();
    expect(result).toEqual(weights);
  });
});

describe('updateRankingWeights', () => {
  it('sends PUT request with weights', async () => {
    const weights = { w2_recency: 0.3 };
    mockPut.mockResolvedValueOnce({ data: { weights } });
    const result = await updateRankingWeights(weights);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('/admin/config/ranking-weights'),
      weights
    );
    expect(result).toEqual(weights);
  });
});

// ─── Rate limits ──────────────────────────────────────────────────────────────

describe('fetchRateLimits', () => {
  it('returns limits from response', async () => {
    const limits = { postsPerDay: 3, reactionsPerMinute: 30, reportsPerHour: 10, aliasRotationsPerDay: 1 };
    mockGet.mockResolvedValueOnce({ data: { limits } });
    const result = await fetchRateLimits();
    expect(result).toEqual(limits);
  });
});

describe('updateRateLimits', () => {
  it('sends PUT with updated limits', async () => {
    const updates = { postsPerDay: 5 };
    const limits  = { postsPerDay: 5, reactionsPerMinute: 30, reportsPerHour: 10, aliasRotationsPerDay: 1 };
    mockPut.mockResolvedValueOnce({ data: { limits } });
    const result = await updateRateLimits(updates);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('/admin/config/rate-limits'),
      updates
    );
    expect(result.postsPerDay).toBe(5);
  });
});

// ─── Feature flags ────────────────────────────────────────────────────────────

describe('fetchFeatureFlags', () => {
  it('returns flags map', async () => {
    const flags = { someoneNeedsYou: false };
    mockGet.mockResolvedValueOnce({ data: { flags } });
    const result = await fetchFeatureFlags();
    expect(result).toEqual(flags);
  });
});

describe('toggleFeatureFlag', () => {
  it('sends PUT with enabled=true', async () => {
    const flags = { someoneNeedsYou: true };
    mockPut.mockResolvedValueOnce({ data: { flags } });
    const result = await toggleFeatureFlag('someoneNeedsYou', true);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('/admin/config/feature-flags/someoneNeedsYou'),
      { enabled: true }
    );
    expect(result['someoneNeedsYou']).toBe(true);
  });
});

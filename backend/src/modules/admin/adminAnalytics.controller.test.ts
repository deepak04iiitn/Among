/**
 * adminAnalytics.controller.test.ts — Integration tests for admin analytics/config routes.
 */
import request from 'supertest';
import { createApp } from '../../app';

jest.mock('./adminAnalytics.service', () => ({
  getDashboardMetrics:         jest.fn().mockResolvedValue({ wmc: {}, completion: {}, reportRate: {}, sny: {} }),
  getSafetyMetrics:            jest.fn().mockResolvedValue({}),
  getReportRatePer1000:        jest.fn().mockResolvedValue({ ratePer1000: 0, totalReports: 0, totalContent: 0 }),
  getCategoryBreakdown:        jest.fn().mockResolvedValue([]),
  getWeeklyMeaningfulConnections: jest.fn().mockResolvedValue({ weeklyMeaningfulConnections: 0 }),
  getConversationCompletionRate:  jest.fn().mockResolvedValue({ rate: 0, active: 0, total: 0 }),
  getSnyOptInRate:             jest.fn().mockResolvedValue({ rate: 0 }),
}));

jest.mock('../discovery/adminConfig.service', () => ({
  getRankingWeights: jest.fn().mockResolvedValue({}),
  setRankingWeights: jest.fn().mockResolvedValue({}),
  getRateLimits:     jest.fn().mockResolvedValue({ postsPerDay: 3 }),
  setRateLimits:     jest.fn().mockResolvedValue({ postsPerDay: 5 }),
  getFeatureFlags:   jest.fn().mockResolvedValue({ someoneNeedsYou: false }),
  toggleFeatureFlag: jest.fn().mockResolvedValue({ someoneNeedsYou: true }),
  clearConfigCache:  jest.fn(),
}));

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, _: any, next: () => void) => {
    req.user = { accountId: 'user-id', role: 'user', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
  requireOnboarding: (_: any, __: any, next: () => void) => next(),
  requireRole:       (_: any, __: any, next: () => void) => next(),
  optionalAuth:      (_: any, __: any, next: () => void) => next(),
}));

jest.mock('../../middleware/adminAuth.middleware', () => ({
  requireModerator: (req: any, _: any, next: () => void) => {
    req.user = { accountId: 'mod-id', role: 'moderator', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
  requireAdmin: (req: any, _: any, next: () => void) => {
    req.user = { accountId: 'admin-id', role: 'admin', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  globalRateLimiter:        (_: any, __: any, next: () => void) => next(),
  postRateLimiter:          (_: any, __: any, next: () => void) => next(),
  reactionRateLimiter:      (_: any, __: any, next: () => void) => next(),
  conversationRateLimiter:  (_: any, __: any, next: () => void) => next(),
  aliasRotationRateLimiter: (_: any, __: any, next: () => void) => next(),
  reportRateLimiter:        (_: any, __: any, next: () => void) => next(),
  createRateLimiter: () => (_: any, __: any, next: () => void) => next(),
}));

const app = createApp();

describe('GET /api/admin/analytics/metrics', () => {
  it('returns 200 with metrics', async () => {
    const res = await request(app).get('/api/admin/analytics/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('wmc');
  });
});

describe('GET /api/admin/analytics/safety', () => {
  it('returns 200 with safety metrics', async () => {
    const res = await request(app).get('/api/admin/analytics/safety');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/analytics/categories', () => {
  it('returns 200 with categories array', async () => {
    const res = await request(app).get('/api/admin/analytics/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });
});

describe('GET /api/admin/config/ranking-weights', () => {
  it('returns 200 with weights', async () => {
    const res = await request(app).get('/api/admin/config/ranking-weights');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('weights');
  });
});

describe('PUT /api/admin/config/ranking-weights', () => {
  it('returns 200 with updated weights', async () => {
    const res = await request(app)
      .put('/api/admin/config/ranking-weights')
      .send({ w2_recency: 0.25 });
    expect(res.status).toBe(200);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .put('/api/admin/config/ranking-weights')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/config/rate-limits', () => {
  it('returns 200 with limits', async () => {
    const res = await request(app).get('/api/admin/config/rate-limits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('limits');
  });
});

describe('PUT /api/admin/config/rate-limits', () => {
  it('returns 200 with updated limits', async () => {
    const res = await request(app)
      .put('/api/admin/config/rate-limits')
      .send({ postsPerDay: 5 });
    expect(res.status).toBe(200);
    expect(res.body.limits.postsPerDay).toBe(5);
  });
});

describe('GET /api/admin/config/feature-flags', () => {
  it('returns 200 with flags object', async () => {
    const res = await request(app).get('/api/admin/config/feature-flags');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('flags');
  });
});

describe('PUT /api/admin/config/feature-flags/:flag', () => {
  it('returns 200 when toggling a flag', async () => {
    const res = await request(app)
      .put('/api/admin/config/feature-flags/someoneNeedsYou')
      .send({ enabled: true });
    expect(res.status).toBe(200);
  });

  it('returns 400 when enabled is missing', async () => {
    const res = await request(app)
      .put('/api/admin/config/feature-flags/someoneNeedsYou')
      .send({});
    expect(res.status).toBe(400);
  });
});

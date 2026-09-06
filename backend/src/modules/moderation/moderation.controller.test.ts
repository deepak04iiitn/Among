/**
 * moderation.controller.test.ts — Integration tests for moderation HTTP routes.
 */
import request from 'supertest';
import { createApp } from '../../app';
import * as reportService from './report.service';
import * as blockService from '../blocks/block.service';
import * as enforcementService from './enforcement.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./report.service', () => ({
  submitReport:        jest.fn().mockResolvedValue({ success: true }),
  getOpenReportsQueue: jest.fn().mockResolvedValue({ reports: [], cursor: null }),
  actionReport:        jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../blocks/block.service', () => ({
  blockUser:          jest.fn().mockResolvedValue(undefined),
  unblockUser:        jest.fn().mockResolvedValue(undefined),
  getBlockedAccounts: jest.fn().mockResolvedValue([]),
}));
jest.mock('./enforcement.service', () => ({
  applyWarning:             jest.fn().mockResolvedValue(undefined),
  applyCooldown:            jest.fn().mockResolvedValue(undefined),
  applyTemporaryRestriction: jest.fn().mockResolvedValue(undefined),
  applyPermanentBan:        jest.fn().mockResolvedValue(undefined),
  liftRestriction:          jest.fn().mockResolvedValue(undefined),
  forceAliasRotation:       jest.fn().mockResolvedValue(undefined),
  getActiveRestriction:     jest.fn().mockResolvedValue({ isRestricted: false, restrictionType: null, expiresAt: null }),
}));

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, _res: any, next: () => void) => {
    req.user = {
      accountId:              'test-account-id',
      uid:                    'test-uid',
      role:                   'moderator',
      isBanned:               false,
      hasCompletedOnboarding: true,
    };
    next();
  },
  requireOnboarding: (_req: any, _res: any, next: () => void) => next(),
  requireRole:       (_req: any, _res: any, next: () => void) => next(),
  optionalAuth:      (_req: any, _res: any, next: () => void) => next(),
}));

jest.mock('../../middleware/adminAuth.middleware', () => ({
  requireModerator: (req: any, _res: any, next: () => void) => {
    req.user = { accountId: 'mod-account-id', role: 'moderator', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
  requireAdmin: (req: any, _res: any, next: () => void) => {
    req.user = { accountId: 'admin-account-id', role: 'admin', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  globalRateLimiter:        (_req: any, _res: any, next: () => void) => next(),
  postRateLimiter:          (_req: any, _res: any, next: () => void) => next(),
  reactionRateLimiter:      (_req: any, _res: any, next: () => void) => next(),
  conversationRateLimiter:  (_req: any, _res: any, next: () => void) => next(),
  aliasRotationRateLimiter: (_req: any, _res: any, next: () => void) => next(),
  reportRateLimiter:        (_req: any, _res: any, next: () => void) => next(),
  createRateLimiter: () => (_req: any, _res: any, next: () => void) => next(),
}));

const mockSubmitReport   = reportService.submitReport        as jest.Mock;
const mockGetQueue       = reportService.getOpenReportsQueue  as jest.Mock;
void (reportService.actionReport as jest.Mock);
const mockBlockUser      = blockService.blockUser             as jest.Mock;
const mockUnblockUser    = blockService.unblockUser           as jest.Mock;
const mockGetBlocked     = blockService.getBlockedAccounts    as jest.Mock;
const mockGetRestriction = enforcementService.getActiveRestriction as jest.Mock;

const app = createApp();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/reports', () => {
  it('returns 200 with success: true', async () => {
    mockSubmitReport.mockResolvedValueOnce({ success: true });
    const res = await request(app)
      .post('/api/reports')
      .send({ contentType: 'post', contentId: 'abc123', reason: 'harassment' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for invalid reason', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send({ contentType: 'post', contentId: 'abc', reason: 'invalid_reason' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing contentType', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send({ contentId: 'abc', reason: 'spam' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users/me/blocks', () => {
  it('returns 200 with block list', async () => {
    mockGetBlocked.mockResolvedValueOnce([{ blockedAccountId: 'acc-2', createdAt: new Date().toISOString() }]);
    const res = await request(app).get('/api/users/me/blocks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.blocks)).toBe(true);
  });
});

describe('POST /api/users/me/blocks', () => {
  it('returns 200 on successful block', async () => {
    mockBlockUser.mockResolvedValueOnce(undefined);
    const res = await request(app)
      .post('/api/users/me/blocks')
      .send({ blockedAccountId: 'some-id' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when blockedAccountId is missing', async () => {
    const res = await request(app).post('/api/users/me/blocks').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/me/blocks/:accountId', () => {
  it('returns 200 on successful unblock', async () => {
    mockUnblockUser.mockResolvedValueOnce(undefined);
    const res = await request(app).delete('/api/users/me/blocks/some-account-id');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/admin/reports', () => {
  it('returns 200 with report queue', async () => {
    mockGetQueue.mockResolvedValueOnce({ reports: [], cursor: null });
    const res = await request(app).get('/api/admin/reports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reports)).toBe(true);
  });
});

describe('POST /api/admin/reports/:id/action', () => {
  it('returns 200 on valid action', async () => {
    const res = await request(app)
      .post('/api/admin/reports/report-id/action')
      .send({ action: 'DISMISS' });
    if (res.status !== 200) console.error('500 body:', JSON.stringify(res.body));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for missing action', async () => {
    const res = await request(app)
      .post('/api/admin/reports/report-id/action')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/users/:id', () => {
  it('returns restriction info', async () => {
    mockGetRestriction.mockResolvedValueOnce({ isRestricted: false, restrictionType: null, expiresAt: null });
    const res = await request(app).get('/api/admin/users/user-id');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isRestricted: false });
  });
});

describe('POST /api/admin/users/:id/action', () => {
  it('returns 200 on WARN_USER', async () => {
    const res = await request(app)
      .post('/api/admin/users/user-id/action')
      .send({ action: 'WARN_USER' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for invalid action value', async () => {
    const res = await request(app)
      .post('/api/admin/users/user-id/action')
      .send({ action: 'DO_MAGIC' });
    expect(res.status).toBe(400);
  });
});

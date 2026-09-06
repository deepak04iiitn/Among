/**
 * notification.controller.test.ts — Integration tests for notification HTTP routes.
 */
import request from 'supertest';
import { createApp } from '../../app';
import * as notifService from './notification.service';

jest.mock('./notification.service', () => ({
  getUnreadNotifications: jest.fn().mockResolvedValue({ notifications: [], cursor: null }),
  markAsRead:             jest.fn().mockResolvedValue(undefined),
  markAllRead:            jest.fn().mockResolvedValue(undefined),
  createNotification:     jest.fn().mockResolvedValue(null),
}));

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, _res: any, next: () => void) => {
    req.user = {
      accountId:              'test-account-id',
      role:                   'user',
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
    req.user = { accountId: 'mod-id', role: 'moderator', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
  requireAdmin: (req: any, _res: any, next: () => void) => {
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

const mockGetUnread  = notifService.getUnreadNotifications as jest.Mock;
const mockMarkRead   = notifService.markAsRead             as jest.Mock;
const mockMarkAll    = notifService.markAllRead            as jest.Mock;

const app = createApp();

describe('GET /api/notifications', () => {
  it('returns 200 with notifications array', async () => {
    mockGetUnread.mockResolvedValueOnce({ notifications: [], cursor: null });
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  it('returns 200 on success', async () => {
    mockMarkRead.mockResolvedValueOnce(undefined);
    const res = await request(app).put('/api/notifications/notif-id/read');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/notifications/read-all', () => {
  it('returns 200 on success', async () => {
    mockMarkAll.mockResolvedValueOnce(undefined);
    const res = await request(app).post('/api/notifications/read-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/**
 * reaction.controller.test.ts — Integration tests for reaction HTTP routes.
 */
import request from 'supertest';
import { createApp } from '../../app';
import type express from 'express';
import { Types } from 'mongoose';
import {
  PRIMARY_REACTION_IDS,
  SECONDARY_REACTION_IDS,
} from '../../constants/reactionTypes';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./reaction.service');
jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn((req: any, _res: any, next: () => void) => {
    req.user = { accountId: MOCK_ACCOUNT_ID, firebaseUid: 'uid-123', role: 'user', isOnboarded: true };
    next();
  }),
  requireOnboarding: jest.fn((_req: any, _res: any, next: () => void) => next()),
  optionalAuth: jest.fn((req: any, _res: any, next: () => void) => {
    req.user = { accountId: MOCK_ACCOUNT_ID, firebaseUid: 'uid-123', role: 'user', isOnboarded: true };
    next();
  }),
}));
jest.mock('../../middleware/rateLimiter.middleware', () => ({
  createRateLimiter:        () => jest.fn((_req: any, _res: any, next: () => void) => next()),
  globalRateLimiter:        jest.fn((_req: any, _res: any, next: () => void) => next()),
  aliasRotationRateLimiter: jest.fn((_req: any, _res: any, next: () => void) => next()),
  reactionRateLimiter:      jest.fn((_req: any, _res: any, next: () => void) => next()),
  conversationRateLimiter:  jest.fn((_req: any, _res: any, next: () => void) => next()),
}));

import * as reactionService from './reaction.service';

const MOCK_ACCOUNT_ID = new Types.ObjectId().toString();
const MOCK_POST_ID    = new Types.ObjectId().toString();
const mockService     = reactionService as jest.Mocked<typeof reactionService>;

const ZERO_COUNTS = {
  current: 0, past: 0, considering: 0,
  same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
};

import type { UserReaction } from './reaction.service';

const MY_REACTION: UserReaction = {
  postId:             MOCK_POST_ID,
  primaryReaction:    PRIMARY_REACTION_IDS.CURRENT,
  secondaryReactions: [],
};

let app: express.Application;

beforeAll(() => { app = createApp(); });
beforeEach(() => { jest.clearAllMocks(); });

// ─── PUT /api/posts/:postId/reactions ─────────────────────────────────────────

describe('PUT /api/posts/:postId/reactions', () => {
  it('returns 200 with counts and myReaction', async () => {
    mockService.setReaction.mockResolvedValue({
      counts:    { ...ZERO_COUNTS, current: 1 },
      myReaction: { ...MY_REACTION, primaryReaction: PRIMARY_REACTION_IDS.CURRENT },
    });

    const res = await request(app)
      .put(`/api/posts/${MOCK_POST_ID}/reactions`)
      .send({ primaryReaction: PRIMARY_REACTION_IDS.CURRENT });

    expect(res.status).toBe(200);
    expect(res.body.counts.current).toBe(1);
    expect(res.body.myReaction.primaryReaction).toBe(PRIMARY_REACTION_IDS.CURRENT);
    // Privacy: no accountId in response
    expect(res.body.myReaction).not.toHaveProperty('accountId');
  });

  it('accepts secondary reactions', async () => {
    mockService.setReaction.mockResolvedValue({
      counts:    { ...ZERO_COUNTS, same: 1 },
      myReaction: { ...MY_REACTION, primaryReaction: null, secondaryReactions: [SECONDARY_REACTION_IDS.SAME] },
    });

    const res = await request(app)
      .put(`/api/posts/${MOCK_POST_ID}/reactions`)
      .send({ secondaryReactions: [SECONDARY_REACTION_IDS.SAME] });

    expect(res.status).toBe(200);
    expect(res.body.myReaction.secondaryReactions).toContain(SECONDARY_REACTION_IDS.SAME);
  });

  it('returns 400 for invalid primary reaction', async () => {
    const res = await request(app)
      .put(`/api/posts/${MOCK_POST_ID}/reactions`)
      .send({ primaryReaction: 'not-valid' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/posts/:postId/reactions ─────────────────────────────────────

describe('DELETE /api/posts/:postId/reactions', () => {
  it('returns 200 with updated counts', async () => {
    mockService.removeReaction.mockResolvedValue(ZERO_COUNTS);

    const res = await request(app).delete(`/api/posts/${MOCK_POST_ID}/reactions`);

    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual(ZERO_COUNTS);
  });
});

// ─── GET /api/posts/:postId/reactions ─────────────────────────────────────────

describe('GET /api/posts/:postId/reactions', () => {
  it('returns 200 with counts and myReaction when authenticated', async () => {
    mockService.getAggregateCounts.mockResolvedValue({ ...ZERO_COUNTS, same: 5 });
    mockService.getUserReactionForPost.mockResolvedValue(MY_REACTION);

    const res = await request(app).get(`/api/posts/${MOCK_POST_ID}/reactions`);

    expect(res.status).toBe(200);
    expect(res.body.counts.same).toBe(5);
    expect(res.body.myReaction).toBeDefined();
    // Privacy: counts must not have user identifiers
    expect(res.body.counts).not.toHaveProperty('accountId');
  });

  it('returns null myReaction when not authenticated', async () => {
    jest.resetModules();
    // Re-mock auth middleware to simulate unauthenticated user
    const { requireAuth: _rA, requireOnboarding: _rO, optionalAuth } = jest.requireMock('../../middleware/auth.middleware') as any;
    optionalAuth.mockImplementation((_req: any, _res: any, next: () => void) => next()); // no req.user

    mockService.getAggregateCounts.mockResolvedValue(ZERO_COUNTS);

    const res = await request(app).get(`/api/posts/${MOCK_POST_ID}/reactions`);
    expect(res.status).toBe(200);
    expect(res.body.counts).toBeDefined();
  });
});

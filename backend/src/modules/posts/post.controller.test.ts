/**
 * post.controller.test.ts — Integration tests for post HTTP routes.
 * Uses supertest against the full Express app (DB is mocked at service level).
 */
import request from 'supertest';
import { createApp } from '../../app';
import type express from 'express';
import { Types } from 'mongoose';
import { POST_STATUS, POST_EXPERIENCE_STATE, POST_VISIBILITY } from '../../constants/postStates';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./post.service');
jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: jest.fn((req: any, _res: any, next: () => void) => {
    req.user = { accountId: MOCK_ACCOUNT_ID, firebaseUid: 'uid-123', role: 'user', isOnboarded: true };
    next();
  }),
  requireOnboarding: jest.fn((_req: any, _res: any, next: () => void) => next()),
  optionalAuth: jest.fn((req: any, _res: any, next: () => void) => {
    // Simulate authenticated but optional
    req.user = { accountId: MOCK_ACCOUNT_ID, firebaseUid: 'uid-123', role: 'user', isOnboarded: true };
    next();
  }),
}));
jest.mock('../../middleware/rateLimiter.middleware', () => ({
  createRateLimiter:        () => jest.fn((_req: any, _res: any, next: () => void) => next()),
  globalRateLimiter:        jest.fn((_req: any, _res: any, next: () => void) => next()),
  aliasRotationRateLimiter: jest.fn((_req: any, _res: any, next: () => void) => next()),
  postRateLimiter:          jest.fn((_req: any, _res: any, next: () => void) => next()),
  reactionRateLimiter:      jest.fn((_req: any, _res: any, next: () => void) => next()),
  conversationRateLimiter:  jest.fn((_req: any, _res: any, next: () => void) => next()),
}));

import * as postService from './post.service';

const MOCK_ACCOUNT_ID = new Types.ObjectId().toString();
const MOCK_POST_ID    = new Types.ObjectId().toString();
const mockService     = postService as jest.Mocked<typeof postService>;

function makePublicPost(id = MOCK_POST_ID) {
  return {
    id,
    body:             'I have been struggling with loneliness since moving cities last year.',
    categoryIds:      ['loneliness'],
    state:            POST_EXPERIENCE_STATE.CURRENT,
    visibilityScope:  POST_VISIBILITY.BROAD,
    status:           POST_STATUS.PUBLISHED,
    authorAlias:      'QuietRiver',
    authorAvatarSeed: 'seed-abc',
    publishedAt:      new Date().toISOString(),
    editableUntil:    new Date(Date.now() + 900_000).toISOString(),
    editedAt:         null,
    reactionCounts:   { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
    isOwnPost:        true,
  };
}

let app: express.Application;

beforeAll(() => {
  app = createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────

describe('POST /api/posts', () => {
  it('returns 201 with created post on success', async () => {
    mockService.createPost.mockResolvedValue({
      post:           makePublicPost(),
      crisisDetected: false,
      crisisType:     null,
      safetyWarnings: [],
    });

    const res = await request(app)
      .post('/api/posts')
      .send({
        body:            'I have been struggling with loneliness since moving to a new city.',
        categoryIds:     ['loneliness'],
        state:           POST_EXPERIENCE_STATE.CURRENT,
        visibilityScope: POST_VISIBILITY.BROAD,
      });

    expect(res.status).toBe(201);
    expect(res.body.post).toBeDefined();
    expect(res.body.post).not.toHaveProperty('authorAccountId');
    expect(res.body.crisisDetected).toBe(false);
  });

  it('returns 201 with crisisResources when crisis detected', async () => {
    mockService.createPost.mockResolvedValue({
      post:           makePublicPost(),
      crisisDetected: true,
      crisisType:     'self_harm',
      safetyWarnings: [],
    });

    const res = await request(app)
      .post('/api/posts')
      .send({
        body:        'Something long enough to pass validation threshold here.',
        categoryIds: [],
        state:       POST_EXPERIENCE_STATE.CURRENT,
      });

    expect(res.status).toBe(201);
    expect(res.body.crisisDetected).toBe(true);
    expect(res.body.crisisResources).toBeDefined();
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ body: 'Too short' }); // missing state, and body too short

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

describe('GET /api/posts/:id', () => {
  it('returns 200 with post for published post', async () => {
    mockService.getPostById.mockResolvedValue(makePublicPost());

    const res = await request(app).get(`/api/posts/${MOCK_POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(MOCK_POST_ID);
    expect(res.body).not.toHaveProperty('authorAccountId');
  });

  it('returns 410 with redirect info for deleted post', async () => {
    mockService.getPostById.mockResolvedValue({
      status:             POST_STATUS.DELETED_BY_USER,
      redirectCategoryId: 'loneliness',
    });

    const res = await request(app).get(`/api/posts/${MOCK_POST_ID}`);
    expect(res.status).toBe(410);
    expect(res.body.redirectCategoryId).toBe('loneliness');
  });
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

describe('PUT /api/posts/:id', () => {
  it('returns 200 with updated post', async () => {
    const updated = makePublicPost();
    updated.body = 'Updated body with more than twenty characters here.';
    mockService.editPost.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/api/posts/${MOCK_POST_ID}`)
      .send({ body: 'Updated body with more than twenty characters here.' });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('authorAccountId');
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app)
      .put(`/api/posts/${MOCK_POST_ID}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/posts/:id ───────────────────────────────────────────────────

describe('DELETE /api/posts/:id', () => {
  it('returns 200 on success', async () => {
    mockService.deletePost.mockResolvedValue(undefined);

    const res = await request(app).delete(`/api/posts/${MOCK_POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── GET /api/posts/my ───────────────────────────────────────────────────────

describe('GET /api/posts/my', () => {
  it('returns 200 with author posts', async () => {
    mockService.getPostsByAuthor.mockResolvedValue({
      posts:      [makePublicPost()],
      nextCursor: null,
    });

    const res = await request(app).get('/api/posts/my');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.nextCursor).toBeNull();
  });
});

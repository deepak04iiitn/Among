/**
 * conversation.controller.test.ts — Integration tests for conversation HTTP endpoints.
 */
import request from 'supertest';
import { createApp } from '../../app';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const ACCOUNT_A = 'account_a_id';

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth:        jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  requireOnboarding:  jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  requireRole:        jest.fn(() => (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  optionalAuth:       jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  globalRateLimiter:         jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  postRateLimiter:           jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  reactionRateLimiter:       jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  conversationRateLimiter:   jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  aliasRotationRateLimiter:  jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  reportRateLimiter:         jest.fn((_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
  createRateLimiter:         jest.fn(() => (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next()),
}));

jest.mock('./matching.service', () => ({
  createMatchRequest: jest.fn().mockResolvedValue({
    matched:      false,
    conversation: { _id: 'conv_id_1', state: 'requested' },
  }),
  cancelMatchRequest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./conversation.service', () => ({
  listConversationsForUser: jest.fn().mockResolvedValue([
    {
      id:                'conv_1',
      contextCategoryId: 'loneliness',
      state:             'active',
      otherAliasSnapshot: { aliasName: 'OtherAlias', avatarSeed: 'seed' },
      startedAt:         new Date().toISOString(),
      endedAt:           null,
      lastActivityAt:    new Date().toISOString(),
    },
  ]),
  getConversationForUser: jest.fn().mockResolvedValue({
    id:                'conv_1',
    contextCategoryId: 'loneliness',
    state:             'active',
    myAliasSnapshot:   { aliasName: 'MyAlias', avatarSeed: 'seedM' },
    otherAliasSnapshot: { aliasName: 'OtherAlias', avatarSeed: 'seedO' },
    requestedAt:       new Date().toISOString(),
    matchedAt:         new Date().toISOString(),
    startedAt:         new Date().toISOString(),
    expiresAt:         null,
    endedAt:           null,
    endReason:         null,
    feedbackSubmitted:  false,
    transcriptVisible:  false,
  }),
  endConversation:  jest.fn().mockResolvedValue(undefined),
  submitFeedback:   jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./message.service', () => ({
  sendMessage: jest.fn().mockResolvedValue({
    message: {
      id:                  'msg_1',
      senderAliasSnapshot: 'MyAlias',
      senderAvatarSeed:    'seedM',
      body:                'Hello',
      contactInfoWarning:  false,
      sentAt:              new Date().toISOString(),
      isDeleted:           false,
    },
    contactInfoWarning:   false,
    warningCategories:    [],
    isNewWarning:         false,
    newConversationState: 'active',
  }),
  getMessages: jest.fn().mockResolvedValue({
    messages:   [],
    nextCursor: null,
  }),
}));

// Inject user into request
jest.mock('../../middleware/sanitize.middleware', () => ({
  sanitizeBody: (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    req.user = { accountId: ACCOUNT_A, firebaseUid: 'firebase-uid-a', role: 'user', isBanned: false, hasCompletedOnboarding: true };
    next();
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

let app: ReturnType<typeof createApp>;
beforeAll(() => { app = createApp(); });

describe('POST /api/conversations/request', () => {
  it('returns 201 with matched=false when no match available', async () => {
    const res = await request(app)
      .post('/api/conversations/request')
      .send({ contextCategoryId: 'loneliness' });

    expect(res.status).toBe(201);
    expect(res.body.matched).toBe(false);
    expect(res.body.conversationId).toBe('conv_id_1');
  });

  it('returns 400 for invalid category', async () => {
    const res = await request(app)
      .post('/api/conversations/request')
      .send({ contextCategoryId: 'not_a_category' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/conversations/:id/request', () => {
  it('returns 200 on successful cancel', async () => {
    const res = await request(app)
      .delete('/api/conversations/conv_1/request');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/conversations', () => {
  it('returns list of conversations', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.conversations)).toBe(true);
    // Privacy: no participantAccountIds
    for (const conv of res.body.conversations as Record<string, unknown>[]) {
      expect(conv).not.toHaveProperty('participantAccountIds');
    }
  });
});

describe('GET /api/conversations/:id', () => {
  it('returns conversation detail without private fields', async () => {
    const res = await request(app).get('/api/conversations/conv_1');
    expect(res.status).toBe(200);
    expect(res.body.conversation).not.toHaveProperty('participantAccountIds');
    expect(res.body.conversation.id).toBe('conv_1');
  });
});

describe('POST /api/conversations/:id/end', () => {
  it('returns 200', async () => {
    const res = await request(app).post('/api/conversations/conv_1/end');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/conversations/:id/feedback', () => {
  it('returns 200 for valid feedback', async () => {
    const res = await request(app)
      .post('/api/conversations/conv_1/feedback')
      .send({ helpful: true });

    expect(res.status).toBe(200);
  });

  it('returns 400 for missing helpful field', async () => {
    const res = await request(app)
      .post('/api/conversations/conv_1/feedback')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/conversations/:id/messages', () => {
  it('sends a message and returns 201', async () => {
    const res = await request(app)
      .post('/api/conversations/conv_1/messages')
      .send({ body: 'Hello there' });

    expect(res.status).toBe(201);
    expect(res.body.message.body).toBe('Hello');
    // Privacy: no senderAccountId
    expect(res.body.message).not.toHaveProperty('senderAccountId');
  });

  it('returns 400 for empty message body', async () => {
    const res = await request(app)
      .post('/api/conversations/conv_1/messages')
      .send({ body: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/conversations/:id/messages', () => {
  it('returns messages array', async () => {
    const res = await request(app).get('/api/conversations/conv_1/messages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});

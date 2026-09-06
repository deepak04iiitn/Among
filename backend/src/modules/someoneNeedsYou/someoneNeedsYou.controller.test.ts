/**
 * someoneNeedsYou.controller.test.ts — Integration tests for SNY HTTP routes.
 */
import request from 'supertest';
import { createApp } from '../../app';
import * as snyService from './someoneNeedsYou.service';
import * as egService  from '../experienceGraph/experienceGraph.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./someoneNeedsYou.service');
jest.mock('../experienceGraph/experienceGraph.service');

jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, _res: any, next: () => void) => {
    req.user = {
      accountId:              'test-account-id',
      uid:                    'test-uid',
      isBanned:               false,
      hasCompletedOnboarding: true,
    };
    next();
  },
  requireOnboarding: (_req: any, _res: any, next: () => void) => next(),
  requireRole:       (_req: any, _res: any, next: () => void) => next(),
  optionalAuth:      (_req: any, _res: any, next: () => void) => next(),
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

const mockGetDailyPrompt    = snyService.getDailyPromptForUser as jest.Mock;
const mockSkipPrompt        = snyService.skipPrompt            as jest.Mock;
const mockAcceptPrompt      = snyService.acceptPrompt          as jest.Mock;
const mockDismissPrompt     = snyService.dismissPromptForToday as jest.Mock;
const mockGetStatus         = snyService.getPromptStatus       as jest.Mock;
const mockGetHistory        = egService.getExperienceHistory   as jest.Mock;
const mockUpdateOptIn       = egService.updateSnyOptIn         as jest.Mock;

const app = createApp();

const SAMPLE_PROMPT = {
  postId:        'post-abc',
  categoryId:    'anxiety',
  bodyPreview:   'I feel so alone...',
  skipsUsed:     0,
  skipsRemaining: 3,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/sny/prompt', () => {
  it('returns 200 with a prompt when one is available', async () => {
    mockGetDailyPrompt.mockResolvedValueOnce(SAMPLE_PROMPT);
    const res = await request(app).get('/api/sny/prompt');
    expect(res.status).toBe(200);
    expect(res.body.prompt.postId).toBe('post-abc');
  });

  it('returns 200 with null prompt when none is available', async () => {
    mockGetDailyPrompt.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/sny/prompt');
    expect(res.status).toBe(200);
    expect(res.body.prompt).toBeNull();
  });
});

describe('POST /api/sny/skip', () => {
  it('returns 200 with the next prompt', async () => {
    mockSkipPrompt.mockResolvedValueOnce(SAMPLE_PROMPT);
    const res = await request(app)
      .post('/api/sny/skip')
      .send({ skippedPostId: 'post-abc' });
    expect(res.status).toBe(200);
    expect(res.body.prompt).toBeDefined();
  });

  it('returns 400 for missing skippedPostId', async () => {
    const res = await request(app).post('/api/sny/skip').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/sny/accept', () => {
  it('returns 200 with contextCategoryId and contextPostId', async () => {
    mockAcceptPrompt.mockResolvedValueOnce({
      contextCategoryId: 'anxiety',
      contextPostId:     'post-abc',
    });
    const res = await request(app)
      .post('/api/sny/accept')
      .send({ promptPostId: 'post-abc' });
    expect(res.status).toBe(200);
    expect(res.body.contextCategoryId).toBe('anxiety');
    expect(res.body.contextPostId).toBe('post-abc');
  });

  it('returns 400 for missing promptPostId', async () => {
    const res = await request(app).post('/api/sny/accept').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/sny/dismiss', () => {
  it('returns 200 on success', async () => {
    mockDismissPrompt.mockReturnValueOnce(undefined);
    const res = await request(app).post('/api/sny/dismiss').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/sny/status', () => {
  it('returns prompt status', async () => {
    mockGetStatus.mockReturnValueOnce({ dismissed: false, promptsSent: 0, skipsUsed: 0 });
    const res = await request(app).get('/api/sny/status');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ dismissed: false, promptsSent: 0, skipsUsed: 0 });
  });
});

describe('GET /api/sny/history', () => {
  it('returns experience history', async () => {
    mockGetHistory.mockResolvedValueOnce([
      { categoryId: 'grief', pastReactionCount: 2, conversationCount: 1, snyOptIn: true },
    ]);
    const res = await request(app).get('/api/sny/history');
    expect(res.status).toBe(200);
    expect(res.body.experiences[0].categoryId).toBe('grief');
  });
});

describe('PATCH /api/sny/opt-in', () => {
  it('returns 200 on success', async () => {
    mockUpdateOptIn.mockResolvedValueOnce(undefined);
    const res = await request(app)
      .patch('/api/sny/opt-in')
      .send({ categoryId: 'anxiety', optIn: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app).patch('/api/sny/opt-in').send({ categoryId: '', optIn: 'yes' });
    expect(res.status).toBe(400);
  });
});

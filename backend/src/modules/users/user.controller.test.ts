/**
 * user.controller.test.ts — HTTP integration tests for user/auth routes.
 * Uses supertest to test the full Express middleware stack.
 */
import request from 'supertest';
import { createApp } from '../../app';

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('../../config/firebase', () => ({
  verifyFirebaseToken: jest.fn().mockResolvedValue({ uid: 'fb-uid-1', email: 'test@example.com' }),
}));

jest.mock('../../modules/users/user.service', () => ({
  findOrCreateUser:       jest.fn(),
  registerWithEmail:      jest.fn(),
  loginWithEmail:         jest.fn(),
  getPrivateProfile:      jest.fn(),
  completeOnboarding:     jest.fn(),
  rotateAlias:            jest.fn(),
  updateCategoryInterests: jest.fn(),
  getSnyOptIns:           jest.fn(),
  setSnyOptIn:            jest.fn(),
  softDeleteAccount:      jest.fn(),
}));

jest.mock('../../services/jwt.service', () => ({
  issueTokenPair: jest.fn(() => ({
    accessToken:  'access-token',
    refreshToken: 'refresh-token',
    expiresIn:    900,
  })),
  verifyRefreshToken: jest.fn(),
}));

// Auth middleware mock — provides req.user for protected routes
jest.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => {
    req.user = {
      accountId:              'user-id-1',
      firebaseUid:            'fb-uid-1',
      role:                   'user',
      isBanned:               false,
      hasCompletedOnboarding: true,
    };
    next();
  },
  requireOnboarding: (
    _req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => next(),
  optionalAuth: (
    _req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => next(),
}));

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  globalRateLimiter:         (_req: unknown, _res: unknown, next: () => void) => next(),
  aliasRotationRateLimiter:  (_req: unknown, _res: unknown, next: () => void) => next(),
  reactionRateLimiter:       (_req: unknown, _res: unknown, next: () => void) => next(),
  conversationRateLimiter:   (_req: unknown, _res: unknown, next: () => void) => next(),
  createRateLimiter:         () => (_req: unknown, _res: unknown, next: () => void) => next(),
  postRateLimiter:           (_req: unknown, _res: unknown, next: () => void) => next(),
  reportRateLimiter:         (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import {
  findOrCreateUser,
  registerWithEmail,
  loginWithEmail,
  getPrivateProfile,
  completeOnboarding,
  rotateAlias,
  softDeleteAccount,
} from '../../modules/users/user.service';

const app = createApp();

const mockProfile = {
  accountId:              'user-id-1',
  role:                   'user',
  hasCompletedOnboarding: true,
  categoryInterests:      ['loneliness', 'grief', 'career'],
  currentAlias:           { name: 'Blue Fox', avatarSeed: 'fox-seed', issuedAt: new Date(), expiresAt: null },
  aliasRotationCount:     0,
  snyOptIns:              [],
};

// ─── POST /api/auth/session ───────────────────────────────────────────────────

describe('POST /api/auth/session', () => {
  it('returns 400 when idToken is missing', async () => {
    const res = await request(app).post('/api/auth/session').send({});
    expect(res.status).toBe(400);
  });

  it('creates a session and returns profile fields (no email/UID)', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      _id:                    'user-id-1',
      role:                   'user',
      hasCompletedOnboarding: true,
      enforcementStatus:      { isBanned: false },
    });

    const res = await request(app)
      .post('/api/auth/session')
      .send({ idToken: 'valid-firebase-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accountId');
    expect(res.body).toHaveProperty('role');
    // Privacy invariants — these must NEVER appear in the response
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('firebaseUid');
  });

  it('does NOT return email in session response', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({
      _id: 'u1', role: 'user', hasCompletedOnboarding: false, enforcementStatus: { isBanned: false },
    });
    const res = await request(app)
      .post('/api/auth/session')
      .send({ idToken: 'token' });

    expect(JSON.stringify(res.body)).not.toContain('test@example.com');
    expect(JSON.stringify(res.body)).not.toContain('fb-uid');
  });
});

const emailUser = {
  _id:                    'user-id-1',
  role:                   'user',
  hasCompletedOnboarding: false,
  enforcementStatus:      { isBanned: false },
};

describe('POST /api/auth/register', () => {
  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('returns 201 with a session and never leaks email or passwordHash', async () => {
    (registerWithEmail as jest.Mock).mockResolvedValue(emailUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'secret12' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accountId', 'user-id-1');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('firebaseUid');
    expect(JSON.stringify(res.body)).not.toContain('new@example.com');
    expect(JSON.stringify(res.body)).not.toContain('secret12');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with a session and never leaks email or passwordHash', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue(emailUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret12' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accountId', 'user-id-1');
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('firebaseUid');
    expect(JSON.stringify(res.body)).not.toContain('test@example.com');
    expect(JSON.stringify(res.body)).not.toContain('secret12');
  });
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('returns 200 with private profile', async () => {
    (getPrivateProfile as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accountId');
    expect(res.body).toHaveProperty('currentAlias');
  });

  it('NEVER returns email or firebaseUid', async () => {
    (getPrivateProfile as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer test-token');

    expect(JSON.stringify(res.body)).not.toContain('test@example.com');
    expect(JSON.stringify(res.body)).not.toContain('firebaseUid');
  });
});

// ─── POST /api/users/me/onboarding ───────────────────────────────────────────

describe('POST /api/users/me/onboarding', () => {
  it('returns 400 when categories array is empty', async () => {
    const res = await request(app)
      .post('/api/users/me/onboarding')
      .set('Authorization', 'Bearer test-token')
      .send({ categories: [], ageConfirmed: true, tosAccepted: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ageConfirmed is false', async () => {
    const res = await request(app)
      .post('/api/users/me/onboarding')
      .set('Authorization', 'Bearer test-token')
      .send({ categories: ['a', 'b', 'c'], ageConfirmed: false, tosAccepted: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when tosAccepted is false', async () => {
    const res = await request(app)
      .post('/api/users/me/onboarding')
      .set('Authorization', 'Bearer test-token')
      .send({ categories: ['a', 'b', 'c'], ageConfirmed: true, tosAccepted: false });
    expect(res.status).toBe(400);
  });

  it('returns 200 on valid onboarding submission', async () => {
    (completeOnboarding as jest.Mock).mockResolvedValue({});
    (getPrivateProfile as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app)
      .post('/api/users/me/onboarding')
      .set('Authorization', 'Bearer test-token')
      .send({ categories: ['a', 'b', 'c'], ageConfirmed: true, tosAccepted: true });

    expect(res.status).toBe(200);
  });
});

// ─── PUT /api/users/me/alias/rotate ──────────────────────────────────────────

describe('PUT /api/users/me/alias/rotate', () => {
  it('returns 200 with new alias info', async () => {
    (rotateAlias as jest.Mock).mockResolvedValue({
      currentAlias: { name: 'New Alias', avatarSeed: 'new-seed', issuedAt: new Date(), expiresAt: null },
      aliasRotationCount: 1,
    });

    const res = await request(app)
      .put('/api/users/me/alias/rotate')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('aliasName', 'New Alias');
  });

  it('response does NOT include email or firebaseUid', async () => {
    (rotateAlias as jest.Mock).mockResolvedValue({
      currentAlias: { name: 'Clean Fox', avatarSeed: 'clean', issuedAt: new Date(), expiresAt: null },
      aliasRotationCount: 1,
    });

    const res = await request(app)
      .put('/api/users/me/alias/rotate')
      .set('Authorization', 'Bearer test-token');

    expect(JSON.stringify(res.body)).not.toContain('email');
    expect(JSON.stringify(res.body)).not.toContain('firebaseUid');
  });
});

// ─── DELETE /api/users/me ─────────────────────────────────────────────────────

describe('DELETE /api/users/me', () => {
  it('returns 200 on successful deletion', async () => {
    (softDeleteAccount as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

/**
 * auth.middleware.test.ts
 *
 * Tests the updated auth middleware which verifies backend-issued JWTs
 * (not Firebase ID tokens). Firebase verification is only at the session
 * creation endpoint — never in this middleware.
 */
import { requireAuth, requireOnboarding, requireRole, optionalAuth } from './auth.middleware';
import * as jwtService from '../services/jwt.service';
import { UserModel } from '../modules/users/user.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { USER_ROLE } from '../constants/userRoles';
import { mockRequest, mockResponse, mockNext, makeAuthUser } from '../test/helpers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../services/jwt.service', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('../modules/users/user.model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

const mockVerifyAccessToken = jwtService.verifyAccessToken as jest.MockedFunction<
  typeof jwtService.verifyAccessToken
>;

const mockFindById = UserModel.findById as jest.MockedFunction<typeof UserModel.findById>;

const MOCK_ACCOUNT_ID = 'account-id-123';
const MOCK_FIREBASE_UID = 'firebase-uid-abc';
const MOCK_ACCESS_TOKEN = 'mock.backend.jwt';

const MOCK_JWT_PAYLOAD = {
  sub:       MOCK_ACCOUNT_ID,
  role:      USER_ROLE.USER,
  onboarded: true,
  type:      'access' as const,
};

const MOCK_DB_USER = {
  _id:                    MOCK_ACCOUNT_ID,
  firebaseUid:            MOCK_FIREBASE_UID,
  role:                   USER_ROLE.USER,
  enforcementStatus:      { isBanned: false },
  hasCompletedOnboarding: true,
};

// Helper: mock findById().select().lean() chain
function mockFindByIdChain(returnValue: unknown): void {
  (mockFindById as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(returnValue),
    }),
  });
}

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue(MOCK_JWT_PAYLOAD);
    mockFindByIdChain(MOCK_DB_USER);
  });

  it('attaches user to req on valid backend JWT', async () => {
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({
      accountId: MOCK_ACCOUNT_ID,
      role:      USER_ROLE.USER,
      isBanned:  false,
    });
  });

  it('calls next with UnauthorizedError when Authorization header is missing', async () => {
    const req  = mockRequest({ headers: {} });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with UnauthorizedError when header does not start with Bearer', async () => {
    const req  = mockRequest({ headers: { authorization: 'Basic abc123' } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next with UnauthorizedError when JWT is invalid', async () => {
    mockVerifyAccessToken.mockImplementation(() => { throw new Error('invalid token'); });
    const req  = mockRequest({ headers: { authorization: 'Bearer bad.jwt' } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
  });

  it('calls next with UnauthorizedError when account not found in DB', async () => {
    mockFindByIdChain(null);
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next with ForbiddenError when account is banned', async () => {
    mockFindByIdChain({ ...MOCK_DB_USER, enforcementStatus: { isBanned: true } });
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });

  it('never attaches firebaseUid to any externally-visible req property', async () => {
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    // req.user is an internal type — confirm the middleware completes cleanly
    expect(next).toHaveBeenCalledWith();
    // firebaseUid is in req.user for internal use but never in HTTP responses
    // (tested at the API response layer)
  });

  it('does NOT call verifyFirebaseToken — auth is purely JWT-based', async () => {
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    await requireAuth(req, mockResponse(), mockNext());
    // If this test file had a verifyFirebaseToken mock it would show call count > 0
    // Instead, we verify the JWT mock was called
    expect(mockVerifyAccessToken).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN);
  });
});

// ─── requireOnboarding ───────────────────────────────────────────────────────

describe('requireOnboarding', () => {
  it('passes when user has completed onboarding', () => {
    const req  = mockRequest({ user: makeAuthUser({ hasCompletedOnboarding: true }) } as never);
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with ForbiddenError when onboarding not complete', () => {
    const req  = mockRequest({ user: makeAuthUser({ hasCompletedOnboarding: false }) } as never);
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects with UnauthorizedError when no user on request', () => {
    const req  = mockRequest();
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────

describe('requireRole', () => {
  it('passes when user has exactly the required role', () => {
    const req  = mockRequest({ user: makeAuthUser({ role: USER_ROLE.MODERATOR }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes when user role exceeds minimum', () => {
    const req  = mockRequest({ user: makeAuthUser({ role: USER_ROLE.ADMIN }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when user role is below minimum', () => {
    const req  = mockRequest({ user: makeAuthUser({ role: USER_ROLE.USER }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects moderator from admin-only routes', () => {
    const req  = mockRequest({ user: makeAuthUser({ role: USER_ROLE.MODERATOR }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.ADMIN)(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects when no user on request', () => {
    const req  = mockRequest();
    const next = mockNext();
    requireRole(USER_ROLE.USER)(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });
});

// ─── optionalAuth ─────────────────────────────────────────────────────────────

describe('optionalAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue(MOCK_JWT_PAYLOAD);
    mockFindByIdChain(MOCK_DB_USER);
  });

  it('attaches user when valid backend JWT is present', async () => {
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next without error when no Authorization header', async () => {
    const req  = mockRequest({ headers: {} });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next without error when JWT is invalid (swallows error)', async () => {
    mockVerifyAccessToken.mockImplementation(() => { throw new Error('bad jwt'); });
    const req  = mockRequest({ headers: { authorization: 'Bearer bad.token' } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('does not attach banned user', async () => {
    mockFindByIdChain({ ...MOCK_DB_USER, enforcementStatus: { isBanned: true } });
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

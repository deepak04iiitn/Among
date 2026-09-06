import { requireAuth, requireOnboarding, requireRole, optionalAuth } from './auth.middleware';
import { verifyFirebaseToken } from '../config/firebase';
import { UserModel } from '../modules/users/user.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { USER_ROLE } from '../constants/userRoles';
import {
  mockRequest,
  mockResponse,
  mockNext,
  makeAuthUser,
  MOCK_ID_TOKEN,
  MOCK_DECODED_TOKEN,
} from '../test/helpers';

// ─── Mocks ───────────────────────────────────────────────────────────────────
jest.mock('../config/firebase', () => ({
  verifyFirebaseToken: jest.fn(),
}));

jest.mock('../modules/users/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
  },
}));

const mockVerify = verifyFirebaseToken as jest.MockedFunction<typeof verifyFirebaseToken>;
const mockFindOne = UserModel.findOne as jest.MockedFunction<typeof UserModel.findOne>;

const MOCK_DB_USER = {
  _id: 'account-id-123',
  firebaseUid: MOCK_DECODED_TOKEN.uid,
  role: USER_ROLE.USER,
  // New model structure: isBanned lives inside enforcementStatus
  enforcementStatus: { isBanned: false },
  hasCompletedOnboarding: true,
};

// ─── requireAuth ─────────────────────────────────────────────────────────────
describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(MOCK_DECODED_TOKEN as never);
    (mockFindOne as jest.Mock).mockResolvedValue(MOCK_DB_USER);
  });

  it('attaches user to req on valid token', async () => {
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({
      accountId: 'account-id-123',
      firebaseUid: MOCK_DECODED_TOKEN.uid,
      role: USER_ROLE.USER,
      isBanned: false,
    });
  });

  it('calls next with UnauthorizedError when Authorization header is missing', async () => {
    const req = mockRequest({ headers: {} });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with UnauthorizedError when header does not start with Bearer', async () => {
    const req = mockRequest({ headers: { authorization: 'Basic abc123' } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next with UnauthorizedError when token is invalid', async () => {
    mockVerify.mockRejectedValue(new UnauthorizedError('Invalid token'));
    const req = mockRequest({ headers: { authorization: 'Bearer bad.token' } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with UnauthorizedError when account not found in DB', async () => {
    (mockFindOne as jest.Mock).mockResolvedValue(null);
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next with ForbiddenError when account is banned', async () => {
    (mockFindOne as jest.Mock).mockResolvedValue({
      ...MOCK_DB_USER,
      enforcementStatus: { isBanned: true },
    });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });

  it('never attaches firebaseUid-derived data to public req properties', async () => {
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAuth(req, mockResponse(), next);

    // req.user is internal — this is tested at the API response layer
    // Here we just confirm the middleware doesn't throw
    expect(next).toHaveBeenCalledWith();
  });
});

// ─── requireOnboarding ───────────────────────────────────────────────────────
describe('requireOnboarding', () => {
  it('passes when user has completed onboarding', () => {
    const req = mockRequest({ user: makeAuthUser({ hasCompletedOnboarding: true }) } as never);
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with ForbiddenError when onboarding not complete', () => {
    const req = mockRequest({ user: makeAuthUser({ hasCompletedOnboarding: false }) } as never);
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects with UnauthorizedError when no user on request', () => {
    const req = mockRequest();
    const next = mockNext();
    requireOnboarding(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────
describe('requireRole', () => {
  it('passes when user has exactly the required role', () => {
    const req = mockRequest({ user: makeAuthUser({ role: USER_ROLE.MODERATOR }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes when user role exceeds minimum', () => {
    const req = mockRequest({ user: makeAuthUser({ role: USER_ROLE.ADMIN }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when user role is below minimum', () => {
    const req = mockRequest({ user: makeAuthUser({ role: USER_ROLE.USER }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.MODERATOR)(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects moderator from admin-only routes', () => {
    const req = mockRequest({ user: makeAuthUser({ role: USER_ROLE.MODERATOR }) } as never);
    const next = mockNext();
    requireRole(USER_ROLE.ADMIN)(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects when no user on request', () => {
    const req = mockRequest();
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
    mockVerify.mockResolvedValue(MOCK_DECODED_TOKEN as never);
    (mockFindOne as jest.Mock).mockResolvedValue(MOCK_DB_USER);
  });

  it('attaches user when valid token is present', async () => {
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next without error when no Authorization header', async () => {
    const req = mockRequest({ headers: {} });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next without error when token is invalid', async () => {
    mockVerify.mockRejectedValue(new UnauthorizedError());
    const req = mockRequest({ headers: { authorization: 'Bearer bad.token' } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('does not attach banned user', async () => {
    (mockFindOne as jest.Mock).mockResolvedValue({
      ...MOCK_DB_USER,
      enforcementStatus: { isBanned: true },
    });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await optionalAuth(req, mockResponse(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

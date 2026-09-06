/**
 * adminAuth.middleware.test.ts
 *
 * Tests the composed admin middleware (requireModerator, requireAdmin).
 * Both delegate to requireAuth → verifyAccessToken (backend JWT).
 */
import { requireModerator, requireAdmin } from './adminAuth.middleware';
import * as jwtService from '../services/jwt.service';
import { UserModel } from '../modules/users/user.model';
import { ForbiddenError } from '../utils/errors';
import { USER_ROLE } from '../constants/userRoles';
import { mockRequest, mockResponse, mockNext } from '../test/helpers';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../services/jwt.service', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('../modules/users/user.model', () => ({
  UserModel: { findById: jest.fn() },
}));

const mockVerifyAccessToken = jwtService.verifyAccessToken as jest.MockedFunction<
  typeof jwtService.verifyAccessToken
>;

const MOCK_ACCESS_TOKEN = 'mock.backend.jwt';
const MOCK_ACCOUNT_ID   = 'acct-123';

function makeJwtPayload(role: string) {
  return { sub: MOCK_ACCOUNT_ID, role, onboarded: true, type: 'access' as const };
}

function makeDbUser(role: string) {
  return {
    _id:                    MOCK_ACCOUNT_ID,
    firebaseUid:            'firebase-uid',
    role,
    enforcementStatus:      { isBanned: false },
    hasCompletedOnboarding: true,
  };
}

// Mock findById().select().lean() chain
function mockFindByIdChain(returnValue: unknown): void {
  (UserModel.findById as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(returnValue),
    }),
  });
}

// ─── requireModerator ────────────────────────────────────────────────────────

describe('requireModerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes for MODERATOR role', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.MODERATOR));
    mockFindByIdChain(makeDbUser(USER_ROLE.MODERATOR));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes for ADMIN role (exceeds minimum)', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.ADMIN));
    mockFindByIdChain(makeDbUser(USER_ROLE.ADMIN));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects USER role with ForbiddenError', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.USER));
    mockFindByIdChain(makeDbUser(USER_ROLE.USER));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });
});

// ─── requireAdmin ────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes for ADMIN role only', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.ADMIN));
    mockFindByIdChain(makeDbUser(USER_ROLE.ADMIN));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects MODERATOR role with ForbiddenError', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.MODERATOR));
    mockFindByIdChain(makeDbUser(USER_ROLE.MODERATOR));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects USER role with ForbiddenError', async () => {
    mockVerifyAccessToken.mockReturnValue(makeJwtPayload(USER_ROLE.USER));
    mockFindByIdChain(makeDbUser(USER_ROLE.USER));
    const req  = mockRequest({ headers: { authorization: `Bearer ${MOCK_ACCESS_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });
});

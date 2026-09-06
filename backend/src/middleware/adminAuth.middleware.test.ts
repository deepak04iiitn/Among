import { requireModerator, requireAdmin } from './adminAuth.middleware';
import { verifyFirebaseToken } from '../config/firebase';
import { UserModel } from '../modules/users/user.model';
import { ForbiddenError } from '../utils/errors';
import { USER_ROLE } from '../constants/userRoles';
import { mockRequest, mockResponse, mockNext, MOCK_ID_TOKEN, MOCK_DECODED_TOKEN } from '../test/helpers';

jest.mock('../config/firebase', () => ({ verifyFirebaseToken: jest.fn() }));
jest.mock('../modules/users/user.model', () => ({ UserModel: { findOne: jest.fn() } }));

const mockVerify = verifyFirebaseToken as jest.MockedFunction<typeof verifyFirebaseToken>;
const mockFindOne = UserModel.findOne as jest.MockedFunction<typeof UserModel.findOne>;

function makeDbUser(role: string) {
  return {
    _id: 'acct-123',
    firebaseUid: MOCK_DECODED_TOKEN.uid,
    role,
    isBanned: false,
    hasCompletedOnboarding: true,
  };
}

describe('requireModerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(MOCK_DECODED_TOKEN as never);
  });

  it('passes for MODERATOR role', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.MODERATOR)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes for ADMIN role (exceeds minimum)', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.ADMIN)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects USER role with ForbiddenError', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.USER)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireModerator(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(MOCK_DECODED_TOKEN as never);
  });

  it('passes for ADMIN role only', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.ADMIN)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects MODERATOR role with ForbiddenError', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.MODERATOR)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('rejects USER role with ForbiddenError', async () => {
    (mockFindOne as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(makeDbUser(USER_ROLE.USER)) });
    const req = mockRequest({ headers: { authorization: `Bearer ${MOCK_ID_TOKEN}` } });
    const next = mockNext();
    await requireAdmin(req, mockResponse(), next);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });
});

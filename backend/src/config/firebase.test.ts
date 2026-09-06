import { UnauthorizedError } from '../utils/errors';

// Mock firebase-admin before any imports so the module uses our mock auth
const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn().mockReturnValue({ auth: () => ({ verifyIdToken: mockVerifyIdToken }) }),
  credential: { cert: jest.fn() },
  apps: [],
  app: jest.fn(),
}));

// Also mock getFirebaseAuth so verifyFirebaseToken uses our mockVerifyIdToken
jest.mock('./firebase', () => {
  const mod = jest.requireActual<typeof import('./firebase')>('./firebase');
  return {
    ...mod,
    getFirebaseAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
  };
});

import { verifyFirebaseToken } from './firebase';

const DECODED_TOKEN = {
  uid: 'test-uid',
  email: 'test@example.com',
  iat: 1000,
  exp: 9999999999,
};

describe('verifyFirebaseToken', () => {
  beforeEach(() => mockVerifyIdToken.mockReset());

  it('returns decoded token on success', async () => {
    mockVerifyIdToken.mockResolvedValue(DECODED_TOKEN);
    const result = await verifyFirebaseToken('valid.token');
    expect(result).toEqual(DECODED_TOKEN);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid.token', true);
  });

  it('throws UnauthorizedError for expired token', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'auth/id-token-expired' })
    );
    await expect(verifyFirebaseToken('tok')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for revoked token', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('revoked'), { code: 'auth/id-token-revoked' })
    );
    await expect(verifyFirebaseToken('tok')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for disabled user', async () => {
    mockVerifyIdToken.mockRejectedValue(
      Object.assign(new Error('disabled'), { code: 'auth/user-disabled' })
    );
    await expect(verifyFirebaseToken('tok')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for any unknown Firebase error', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('something unexpected'));
    await expect(verifyFirebaseToken('tok')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returned error has statusCode 401', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('fail'));
    await expect(verifyFirebaseToken('tok')).rejects.toMatchObject({ statusCode: 401 });
  });
});

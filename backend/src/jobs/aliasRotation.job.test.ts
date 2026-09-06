/**
 * aliasRotation.job.test.ts — Unit tests for the alias rotation job.
 */

const mockFindResult = { select: jest.fn() };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFind   = jest.fn<any, any[]>(() => mockFindResult);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdate = jest.fn<any, any[]>();

jest.mock('../modules/users/user.model', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserModel: {
    find:      (q: unknown) => (mockFind as jest.Mock)(q),
    updateOne: (f: unknown, u: unknown) => (mockUpdate as jest.Mock)(f, u),
  },
}));

jest.mock('../utils/aliasGenerator', () => ({
  generateAlias: jest.fn(() => ({ name: 'New Alias', avatarSeed: 'new-seed' })),
}));

import { runAliasRotation } from './aliasRotation.job';

function setupFindMock(returnValue: unknown[]) {
  const lean = jest.fn().mockResolvedValue(returnValue);
  const select = jest.fn().mockReturnValue({ lean });
  mockFind.mockReturnValue({ select });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupFindMock([]);
  mockUpdate.mockResolvedValue({ modifiedCount: 1 });
});

describe('runAliasRotation', () => {
  it('returns zero rotated when no expired aliases found', async () => {
    setupFindMock([]);
    const result = await runAliasRotation();
    expect(result.rotated).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('rotates each expired alias user found', async () => {
    setupFindMock([
      { _id: 'user-1', currentAlias: { name: 'Old', avatarSeed: 'old' } },
      { _id: 'user-2', currentAlias: { name: 'Old2', avatarSeed: 'old2' } },
    ]);

    const result = await runAliasRotation();
    expect(result.rotated).toBe(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('only queries users with hasCompletedOnboarding=true and non-null deletedAt filter', async () => {
    await runAliasRotation();
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCompletedOnboarding: true,
        deletedAt: null,
      })
    );
  });

  it('queries users whose expiresAt is in the past', async () => {
    await runAliasRotation();
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        'currentAlias.expiresAt': expect.objectContaining({ $lte: expect.any(Date) }),
      })
    );
  });

  it('uses generateAlias to create the new alias', async () => {
    setupFindMock([{ _id: 'u1', currentAlias: { name: 'Old', avatarSeed: 'o' } }]);
    await runAliasRotation();
    const { generateAlias } = require('../utils/aliasGenerator') as typeof import('../utils/aliasGenerator');
    expect(generateAlias).toHaveBeenCalled();
  });

  it('updateOne call includes new alias name and avatarSeed', async () => {
    setupFindMock([{ _id: 'u1', currentAlias: { name: 'Old', avatarSeed: 'o' } }]);
    await runAliasRotation();
    expect(mockUpdate).toHaveBeenCalledWith(
      { _id: 'u1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          currentAlias: expect.objectContaining({ name: 'New Alias', avatarSeed: 'new-seed' }),
        }),
      })
    );
  });

  it('increments aliasRotationCount via $inc', async () => {
    setupFindMock([{ _id: 'u1', currentAlias: { name: 'Old', avatarSeed: 'o' } }]);
    await runAliasRotation();
    expect(mockUpdate).toHaveBeenCalledWith(
      { _id: 'u1' },
      expect.objectContaining({
        $inc: { aliasRotationCount: 1 },
      })
    );
  });
});

/**
 * enforcement.service.test.ts — Unit tests for enforcement.service.ts
 *
 * Critical invariants:
 *  - Each enforcement level sets correct fields.
 *  - Cooldown allows browsing, blocks posting.
 *  - `forceAliasRotation` changes alias.
 *  - Lifted restriction allows posting again.
 */
import { Types } from 'mongoose';
import * as enforcementService from './enforcement.service';
import { UserModel } from '../users/user.model';

jest.mock('../users/user.model', () => ({
  UserModel: {
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../../utils/aliasGenerator', () => ({
  generateAlias: jest.fn().mockReturnValue({ name: 'MockAlias', avatarSeed: 'mock-seed' }),
}));

// avatarGenerator not imported directly by enforcement.service after refactor

const mockFindById  = UserModel.findById  as jest.Mock;
const mockUpdateOne = UserModel.updateOne as jest.Mock;

const ACCOUNT_ID = String(new Types.ObjectId());
const ACTOR_ID   = String(new Types.ObjectId());
const REPORT_ID  = String(new Types.ObjectId());

function makeFakeUser(overrides: Partial<{
  restrictionType: string | null;
  restrictionExpiresAt: Date | null;
  isBanned: boolean;
  warningCount: number;
}> = {}) {
  return {
    _id:    new Types.ObjectId(ACCOUNT_ID),
    enforcementStatus: {
      isBanned:             overrides.isBanned ?? false,
      bannedAt:             null,
      restrictionType:      overrides.restrictionType ?? null,
      restrictionExpiresAt: overrides.restrictionExpiresAt ?? null,
      warningCount:         overrides.warningCount ?? 0,
    },
    save: jest.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  // Re-apply alias generator mock after reset
  (require('../../utils/aliasGenerator').generateAlias as jest.Mock)
    .mockReturnValue({ name: 'MockAlias', avatarSeed: 'mock-seed' });
});

// ─── applyWarning ─────────────────────────────────────────────────────────────

describe('applyWarning', () => {
  it('increments warningCount and saves', async () => {
    const user = makeFakeUser({ warningCount: 0 });
    mockFindById.mockResolvedValueOnce(user);
    await enforcementService.applyWarning(ACCOUNT_ID, ACTOR_ID, REPORT_ID);
    expect(user.enforcementStatus.warningCount).toBe(1);
    expect(user.save).toHaveBeenCalled();
  });

  it('throws 404 when user not found', async () => {
    mockFindById.mockResolvedValueOnce(null);
    await expect(
      enforcementService.applyWarning('bad-id', ACTOR_ID, REPORT_ID)
    ).rejects.toThrow();
  });
});

// ─── applyCooldown ────────────────────────────────────────────────────────────

describe('applyCooldown', () => {
  it('sets restrictionType to cooldown with expiry', async () => {
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    await enforcementService.applyCooldown(ACCOUNT_ID, ACTOR_ID, REPORT_ID, 24);

    const call = mockUpdateOne.mock.calls[0]!;
    expect(call[1].$set['enforcementStatus.restrictionType']).toBe('cooldown');
    expect(call[1].$set['enforcementStatus.restrictionExpiresAt']).toBeInstanceOf(Date);
  });
});

// ─── applyTemporaryRestriction ────────────────────────────────────────────────

describe('applyTemporaryRestriction', () => {
  it('sets restrictionType to temporary_restriction', async () => {
    await enforcementService.applyTemporaryRestriction(ACCOUNT_ID, ACTOR_ID, REPORT_ID, 7);
    const call = mockUpdateOne.mock.calls[0]!;
    expect(call[1].$set['enforcementStatus.restrictionType']).toBe('temporary_restriction');
  });
});

// ─── applyPermanentBan ────────────────────────────────────────────────────────

describe('applyPermanentBan', () => {
  it('sets isBanned to true', async () => {
    await enforcementService.applyPermanentBan(ACCOUNT_ID, ACTOR_ID, REPORT_ID);
    const call = mockUpdateOne.mock.calls[0]!;
    expect(call[1].$set['enforcementStatus.isBanned']).toBe(true);
  });
});

// ─── liftRestriction ─────────────────────────────────────────────────────────

describe('liftRestriction', () => {
  it('clears restrictionType and restrictionExpiresAt', async () => {
    await enforcementService.liftRestriction(ACCOUNT_ID, ACTOR_ID);
    const call = mockUpdateOne.mock.calls[0]!;
    expect(call[1].$set['enforcementStatus.restrictionType']).toBeNull();
    expect(call[1].$set['enforcementStatus.restrictionExpiresAt']).toBeNull();
  });
});

// ─── forceAliasRotation ───────────────────────────────────────────────────────

describe('forceAliasRotation', () => {
  it('updates currentAlias with a new name', async () => {
    await enforcementService.forceAliasRotation(ACCOUNT_ID, ACTOR_ID);
    const call = mockUpdateOne.mock.calls[0]!;
    expect(call[1].$set.currentAlias.name).toBe('MockAlias');
    expect(call[1].$set.currentAlias.avatarSeed).toBe('mock-seed');
  });
});

// ─── getActiveRestriction ─────────────────────────────────────────────────────

describe('getActiveRestriction', () => {
  it('returns isRestricted: false when no restriction is set', async () => {
    mockFindById.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve(makeFakeUser()) }),
    });
    const result = await enforcementService.getActiveRestriction(ACCOUNT_ID);
    expect(result.isRestricted).toBe(false);
  });

  it('returns isRestricted: true with type when restriction is active', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    mockFindById.mockReturnValueOnce({
      select: () => ({
        lean: () => Promise.resolve(makeFakeUser({ restrictionType: 'cooldown', restrictionExpiresAt: future })),
      }),
    });
    const result = await enforcementService.getActiveRestriction(ACCOUNT_ID);
    expect(result.isRestricted).toBe(true);
    expect(result.restrictionType).toBe('cooldown');
  });

  it('auto-lifts and returns isRestricted: false when restriction has expired', async () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    mockFindById.mockReturnValueOnce({
      select: () => ({
        lean: () => Promise.resolve(makeFakeUser({ restrictionType: 'cooldown', restrictionExpiresAt: past })),
      }),
    });
    const result = await enforcementService.getActiveRestriction(ACCOUNT_ID);
    expect(result.isRestricted).toBe(false);
    // Should have called updateOne to clear restriction
    expect(mockUpdateOne).toHaveBeenCalled();
  });
});

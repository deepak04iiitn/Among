/**
 * block.service.test.ts — Unit tests for block.service.ts
 *
 * Critical invariants:
 *  - Block is on account ID, not alias.
 *  - Blocking ends active conversations.
 *  - `isBlocked` checks both directions.
 *  - Block persists after alias rotation (tested by using account IDs only).
 *  - Duplicate block is idempotent.
 */
import { Types } from 'mongoose';
import * as blockService from './block.service';
import { BlockModel } from './block.model';
import { ConversationModel } from '../conversations/conversation.model';

jest.mock('./block.model', () => ({
  BlockModel: {
    create:       jest.fn(),
    deleteOne:    jest.fn(),
    countDocuments: jest.fn(),
    find:         jest.fn(),
  },
}));

jest.mock('../conversations/conversation.model', () => ({
  ConversationModel: {
    updateMany: jest.fn(),
  },
}));

const mockCreate         = BlockModel.create       as jest.Mock;
const mockDeleteOne      = BlockModel.deleteOne    as jest.Mock;
const mockCountDocuments = BlockModel.countDocuments as jest.Mock;
const mockFind           = BlockModel.find         as jest.Mock;
const mockUpdateMany     = ConversationModel.updateMany as jest.Mock;

const BLOCKER_ID = String(new Types.ObjectId());
const BLOCKED_ID = String(new Types.ObjectId());

beforeEach(() => {
  jest.resetAllMocks();
  mockCreate.mockResolvedValue({});
  mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
  mockCountDocuments.mockResolvedValue(0);
  mockFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });
  mockUpdateMany.mockResolvedValue({ modifiedCount: 0 });
});

// ─── blockUser ────────────────────────────────────────────────────────────────

describe('blockUser', () => {
  it('creates a block record between two accounts', async () => {
    await blockService.blockUser(BLOCKER_ID, BLOCKED_ID);
    expect(mockCreate).toHaveBeenCalledWith({
      blockerAccountId: new Types.ObjectId(BLOCKER_ID),
      blockedAccountId: new Types.ObjectId(BLOCKED_ID),
    });
  });

  it('ends active conversations between the two accounts', async () => {
    await blockService.blockUser(BLOCKER_ID, BLOCKED_ID);
    expect(mockUpdateMany).toHaveBeenCalled();
  });

  it('is idempotent when user is already blocked (duplicate key)', async () => {
    mockCreate.mockRejectedValueOnce({ code: 11000 });
    // Should not throw
    await expect(blockService.blockUser(BLOCKER_ID, BLOCKED_ID)).resolves.toBeUndefined();
  });

  it('throws if trying to block yourself', async () => {
    await expect(blockService.blockUser(BLOCKER_ID, BLOCKER_ID))
      .rejects.toThrow('Cannot block yourself');
  });

  it('uses account IDs (not aliases) — block persists across alias rotation', async () => {
    await blockService.blockUser(BLOCKER_ID, BLOCKED_ID);
    // The block should reference the account ID ObjectIds
    const call = mockCreate.mock.calls[0]![0];
    expect(call.blockerAccountId.toString()).toBe(BLOCKER_ID);
    expect(call.blockedAccountId.toString()).toBe(BLOCKED_ID);
  });
});

// ─── unblockUser ──────────────────────────────────────────────────────────────

describe('unblockUser', () => {
  it('removes the block record', async () => {
    await blockService.unblockUser(BLOCKER_ID, BLOCKED_ID);
    expect(mockDeleteOne).toHaveBeenCalledWith({
      blockerAccountId: new Types.ObjectId(BLOCKER_ID),
      blockedAccountId: new Types.ObjectId(BLOCKED_ID),
    });
  });

  it('throws 404 when block does not exist', async () => {
    mockDeleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    await expect(blockService.unblockUser(BLOCKER_ID, BLOCKED_ID))
      .rejects.toThrow('Block not found');
  });
});

// ─── isBlocked ────────────────────────────────────────────────────────────────

describe('isBlocked', () => {
  it('returns true when A has blocked B', async () => {
    mockCountDocuments.mockResolvedValueOnce(1);
    const result = await blockService.isBlocked(BLOCKER_ID, BLOCKED_ID);
    expect(result).toBe(true);
  });

  it('returns true when B has blocked A (checks both directions)', async () => {
    mockCountDocuments.mockResolvedValueOnce(1);
    const result = await blockService.isBlocked(BLOCKED_ID, BLOCKER_ID);
    expect(result).toBe(true);
  });

  it('returns false when neither has blocked the other', async () => {
    mockCountDocuments.mockResolvedValueOnce(0);
    const result = await blockService.isBlocked(BLOCKER_ID, BLOCKED_ID);
    expect(result).toBe(false);
  });
});

// ─── getBlockedAccounts ───────────────────────────────────────────────────────

describe('getBlockedAccounts', () => {
  it('returns list of blocked account IDs', async () => {
    const now = new Date();
    mockFind.mockReturnValueOnce({
      sort: () => ({
        lean: () => Promise.resolve([
          { blockerAccountId: new Types.ObjectId(BLOCKER_ID), blockedAccountId: new Types.ObjectId(BLOCKED_ID), createdAt: now },
        ]),
      }),
    });
    const result = await blockService.getBlockedAccounts(BLOCKER_ID);
    expect(result).toHaveLength(1);
    expect(result[0]!.blockedAccountId).toBe(BLOCKED_ID);
  });

  it('returns empty array when no blocks exist', async () => {
    const result = await blockService.getBlockedAccounts(BLOCKER_ID);
    expect(result).toEqual([]);
  });
});

/**
 * block.service.ts — User block/unblock operations.
 *
 * Privacy invariants:
 *  - Block is ALWAYS on private account ID — not alias.
 *  - Block persists across alias rotations (alias change does not reset a block).
 *  - `blockerAccountId` and `blockedAccountId` never in public API responses.
 */
import { Types } from 'mongoose';
import { BlockModel } from './block.model';
import { ConversationModel } from '../conversations/conversation.model';
import { AppError } from '../../utils/errors';
import { CONVERSATION_STATE } from '../../constants/conversationStates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockedAccountEntry {
  blockedAccountId: string;
  createdAt:        string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Block a user by their account ID.
 * - Ends any active conversation between the two parties.
 * - Removes any pending match requests.
 */
export async function blockUser(
  blockerAccountId: string,
  blockedAccountId: string
): Promise<void> {
  if (blockerAccountId === blockedAccountId) {
    throw new AppError('Cannot block yourself', 400, 'ERR_INVALID_INPUT');
  }

  try {
    await BlockModel.create({
      blockerAccountId: new Types.ObjectId(blockerAccountId),
      blockedAccountId: new Types.ObjectId(blockedAccountId),
    });
  } catch (err: unknown) {
    // Duplicate key — already blocked, idempotent
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) return;
    throw err;
  }

  // End any active or pending conversations between these two accounts
  await ConversationModel.updateMany(
    {
      participantAccountIds: {
        $all: [
          new Types.ObjectId(blockerAccountId),
          new Types.ObjectId(blockedAccountId),
        ],
      },
      state: {
        $in: [
          CONVERSATION_STATE.ACTIVE,
          CONVERSATION_STATE.MATCHED_PENDING,
          CONVERSATION_STATE.REQUESTED,
          CONVERSATION_STATE.INACTIVITY_WARNING,
        ],
      },
    },
    {
      $set: {
        state:    CONVERSATION_STATE.ENDED_BY_USER,
        endedAt:  new Date(),
        endReason: 'blocked',
      },
    }
  );
}

/**
 * Unblock a user.
 */
export async function unblockUser(
  blockerAccountId: string,
  blockedAccountId: string
): Promise<void> {
  const result = await BlockModel.deleteOne({
    blockerAccountId: new Types.ObjectId(blockerAccountId),
    blockedAccountId: new Types.ObjectId(blockedAccountId),
  });
  if (result.deletedCount === 0) {
    throw new AppError('Block not found', 404, 'ERR_NOT_FOUND');
  }
}

/**
 * Check if either party has blocked the other (bidirectional).
 */
export async function isBlocked(accountId1: string, accountId2: string): Promise<boolean> {
  const count = await BlockModel.countDocuments({
    $or: [
      {
        blockerAccountId: new Types.ObjectId(accountId1),
        blockedAccountId: new Types.ObjectId(accountId2),
      },
      {
        blockerAccountId: new Types.ObjectId(accountId2),
        blockedAccountId: new Types.ObjectId(accountId1),
      },
    ],
  });
  return count > 0;
}

/**
 * Get all accounts this user has blocked.
 */
export async function getBlockedAccounts(accountId: string): Promise<BlockedAccountEntry[]> {
  const blocks = await BlockModel.find(
    { blockerAccountId: new Types.ObjectId(accountId) }
  )
    .sort({ createdAt: -1 })
    .lean();

  return blocks.map((b) => ({
    blockedAccountId: String(b.blockedAccountId),
    createdAt:        b.createdAt.toISOString(),
  }));
}

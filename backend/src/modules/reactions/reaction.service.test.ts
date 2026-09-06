/**
 * reaction.service.test.ts — Unit tests for the reaction service.
 *
 * Critical coverage (PRD §6.2 — Privacy):
 *  - setReaction upserts correctly
 *  - Primary reaction is exclusive — setting PAST removes any previous CURRENT
 *  - Secondary reactions are additive — can hold multiple
 *  - getAggregateCounts NEVER returns user identifiers
 *  - getUserReactionForPost returns only the caller's own data
 *  - Count recomputation is accurate after multiple set/remove cycles
 *  - Reaction on non-existent post returns 404
 */
import { Types } from 'mongoose';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./reaction.model');
jest.mock('../posts/post.model');

import { ReactionModel } from './reaction.model';
import { PostModel } from '../posts/post.model';
import {
  setReaction,
  removeReaction,
  getUserReactionForPost,
  getAggregateCounts,
} from './reaction.service';
import {
  PRIMARY_REACTION_IDS,
  SECONDARY_REACTION_IDS,
} from '../../constants/reactionTypes';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACCOUNT_ID = new Types.ObjectId().toString();
const POST_ID    = new Types.ObjectId().toString();

const ZERO_COUNTS = {
  current: 0, past: 0, considering: 0,
  same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
};

function makeReaction(
  primaryReaction:    string | null = null,
  secondaryReactions: string[] = []
) {
  return {
    _id:               new Types.ObjectId(),
    accountId:         new Types.ObjectId(ACCOUNT_ID),
    postId:            new Types.ObjectId(POST_ID),
    primaryReaction,
    secondaryReactions,
  };
}

function setupPostExists() {
  (PostModel.exists as jest.Mock) = jest.fn().mockResolvedValue({ _id: POST_ID });
}

function setupAggregateMock(counts = ZERO_COUNTS) {
  (ReactionModel.aggregate as jest.Mock) = jest.fn().mockResolvedValue([counts]);
  (PostModel.updateOne as jest.Mock) = jest.fn().mockResolvedValue({ acknowledged: true });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── setReaction ─────────────────────────────────────────────────────────────

describe('setReaction', () => {
  it('upserts a reaction and returns aggregate counts', async () => {
    setupPostExists();
    setupAggregateMock({ ...ZERO_COUNTS, current: 1 });

    const mockReaction = makeReaction('current', []);
    (ReactionModel.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(mockReaction);

    const result = await setReaction(ACCOUNT_ID, POST_ID, {
      primaryReaction: PRIMARY_REACTION_IDS.CURRENT,
    });

    expect(result.counts.current).toBe(1);
    expect(result.myReaction.primaryReaction).toBe(PRIMARY_REACTION_IDS.CURRENT);
  });

  it('returns only aggregate counts — no accountIds in result', async () => {
    setupPostExists();
    setupAggregateMock({ ...ZERO_COUNTS, same: 5 });

    const mockReaction = makeReaction(null, ['same']);
    (ReactionModel.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(mockReaction);

    const result = await setReaction(ACCOUNT_ID, POST_ID, {
      secondaryReactions: [SECONDARY_REACTION_IDS.SAME],
    });

    expect(result.counts).not.toHaveProperty('accountId');
    expect(result.counts).not.toHaveProperty('accountIds');
    expect(result.myReaction.postId).toBe(POST_ID);
    // myReaction should NOT leak the accountId
    expect(result.myReaction).not.toHaveProperty('accountId');
  });

  it('sets secondary reactions additively', async () => {
    setupPostExists();
    setupAggregateMock({ ...ZERO_COUNTS, same: 1, iUnderstand: 1 });

    const mockReaction = makeReaction(null, ['same', 'i-understand']);
    (ReactionModel.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(mockReaction);

    const result = await setReaction(ACCOUNT_ID, POST_ID, {
      secondaryReactions: [SECONDARY_REACTION_IDS.SAME, SECONDARY_REACTION_IDS.I_UNDERSTAND],
    });

    expect(result.myReaction.secondaryReactions).toContain(SECONDARY_REACTION_IDS.SAME);
    expect(result.myReaction.secondaryReactions).toContain(SECONDARY_REACTION_IDS.I_UNDERSTAND);
  });

  it('replaces primary reaction (exclusive)', async () => {
    setupPostExists();
    // After setting PAST, count for PAST increases, CURRENT stays 0
    setupAggregateMock({ ...ZERO_COUNTS, past: 1 });

    const mockReaction = makeReaction('past', []);
    (ReactionModel.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue(mockReaction);

    const result = await setReaction(ACCOUNT_ID, POST_ID, {
      primaryReaction: PRIMARY_REACTION_IDS.PAST,
    });

    expect(result.myReaction.primaryReaction).toBe(PRIMARY_REACTION_IDS.PAST);
    expect(result.counts.past).toBe(1);
    expect(result.counts.current).toBe(0);
  });

  it('throws 404 when post does not exist', async () => {
    (PostModel.exists as jest.Mock) = jest.fn().mockResolvedValue(null);

    await expect(
      setReaction(ACCOUNT_ID, POST_ID, { primaryReaction: PRIMARY_REACTION_IDS.CURRENT })
    ).rejects.toThrow(/not found/i);
  });

  it('throws 400 for invalid primary reaction ID', async () => {
    setupPostExists();

    await expect(
      setReaction(ACCOUNT_ID, POST_ID, { primaryReaction: 'invalid-reaction' as never })
    ).rejects.toThrow(/Invalid primary reaction/i);
  });

  it('throws 400 for invalid secondary reaction ID', async () => {
    setupPostExists();

    await expect(
      setReaction(ACCOUNT_ID, POST_ID, { secondaryReactions: ['invalid-secondary'] as never })
    ).rejects.toThrow(/Invalid secondary reaction/i);
  });
});

// ─── removeReaction ───────────────────────────────────────────────────────────

describe('removeReaction', () => {
  it('deletes the reaction and recomputes counts', async () => {
    setupPostExists();
    setupAggregateMock(ZERO_COUNTS);

    (ReactionModel.deleteOne as jest.Mock) = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const counts = await removeReaction(ACCOUNT_ID, POST_ID);

    expect(ReactionModel.deleteOne).toHaveBeenCalledWith({
      accountId: expect.anything(),
      postId:    expect.anything(),
    });
    expect(counts).toEqual(ZERO_COUNTS);
  });

  it('throws 404 when post does not exist', async () => {
    (PostModel.exists as jest.Mock) = jest.fn().mockResolvedValue(null);

    await expect(removeReaction(ACCOUNT_ID, POST_ID)).rejects.toThrow(/not found/i);
  });

  it('does not throw when no reaction exists to delete', async () => {
    setupPostExists();
    setupAggregateMock(ZERO_COUNTS);
    (ReactionModel.deleteOne as jest.Mock) = jest.fn().mockResolvedValue({ deletedCount: 0 });

    await expect(removeReaction(ACCOUNT_ID, POST_ID)).resolves.not.toThrow();
  });
});

// ─── getUserReactionForPost ───────────────────────────────────────────────────

describe('getUserReactionForPost', () => {
  it('returns the caller\'s own reaction', async () => {
    const reaction = makeReaction('current', ['same']);
    const mockLean = jest.fn().mockResolvedValue(reaction);
    (ReactionModel.findOne as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getUserReactionForPost(ACCOUNT_ID, POST_ID);

    expect(result).not.toBeNull();
    expect(result?.primaryReaction).toBe('current');
    expect(result?.secondaryReactions).toContain('same');
    // CRITICAL: must not include accountId
    expect(result).not.toHaveProperty('accountId');
  });

  it('returns null when no reaction exists', async () => {
    const mockLean = jest.fn().mockResolvedValue(null);
    (ReactionModel.findOne as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getUserReactionForPost(ACCOUNT_ID, POST_ID);
    expect(result).toBeNull();
  });
});

// ─── getAggregateCounts ───────────────────────────────────────────────────────

describe('getAggregateCounts', () => {
  it('returns aggregate counts without user identifiers', async () => {
    const mockPost = {
      reactionCounts: { ...ZERO_COUNTS, same: 42 },
    };
    const mockSelect = jest.fn().mockReturnThis();
    const mockLean   = jest.fn().mockResolvedValue(mockPost);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect, lean: mockLean });

    const counts = await getAggregateCounts(POST_ID);

    expect(counts.same).toBe(42);
    // Privacy invariant — no user identity
    expect(counts).not.toHaveProperty('accountId');
    expect(counts).not.toHaveProperty('accountIds');
    expect(counts).not.toHaveProperty('users');
  });

  it('throws 404 when post not found', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockLean   = jest.fn().mockResolvedValue(null);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect, lean: mockLean });

    await expect(getAggregateCounts(POST_ID)).rejects.toThrow(/not found/i);
  });
});

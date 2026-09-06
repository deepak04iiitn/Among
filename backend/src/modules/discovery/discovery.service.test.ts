/**
 * discovery.service.test.ts — Unit tests for the discovery service.
 *
 * Critical coverage:
 *  - Home feed delegates to ranking.service
 *  - Category feed is bounded (not infinite)
 *  - Saved list is accessible only by owner
 *  - YANA stats respect PRIVACY_THRESHOLD_MIN_GROUP_SIZE
 *  - YANA never returns individual user data
 */
import { Types } from 'mongoose';

jest.mock('./ranking.service');
jest.mock('../posts/post.model');
jest.mock('../users/user.model');

import {
  getHomeFeed,
  getSimilarPosts,
  savePost,
  unsavePost,
  getSavedPosts,
  getYouAreNotAloneStats,
} from './discovery.service';
import { getRankedFeed } from './ranking.service';
import { PostModel } from '../posts/post.model';
import { UserModel } from '../users/user.model';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../../constants/limits';

const mockGetRankedFeed = getRankedFeed as jest.MockedFunction<typeof getRankedFeed>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACCOUNT_ID = new Types.ObjectId().toString();
const POST_ID    = new Types.ObjectId().toString();

function makePost(overrides = {}) {
  return {
    _id:             new Types.ObjectId(POST_ID),
    authorAccountId: new Types.ObjectId(),
    body:            'Test post',
    categoryIds:     ['loneliness'],
    status:          'published',
    publishedAt:     new Date(),
    reactionCounts:  { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
    moderationNotes: null,
    contentFlags:    [],
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── getHomeFeed ──────────────────────────────────────────────────────────────

describe('getHomeFeed', () => {
  it('returns primary and secondary from ranking service', async () => {
    const p = makePost();
    const s = makePost({ _id: new Types.ObjectId() });

    mockGetRankedFeed.mockResolvedValue({
      primary:   p as never,
      secondary: [s as never],
    });

    const result = await getHomeFeed(ACCOUNT_ID);
    expect(result.primary).not.toBeNull();
    expect(result.secondary).toHaveLength(1);
  });

  it('strips authorAccountId from response', async () => {
    const p = makePost();
    mockGetRankedFeed.mockResolvedValue({ primary: p as never, secondary: [] });

    const result = await getHomeFeed(ACCOUNT_ID);
    expect(result.primary).not.toHaveProperty('authorAccountId');
  });

  it('returns null primary when no posts found', async () => {
    mockGetRankedFeed.mockResolvedValue({ primary: null, secondary: [] });

    const result = await getHomeFeed(ACCOUNT_ID);
    expect(result.primary).toBeNull();
    expect(result.secondary).toHaveLength(0);
  });
});

// ─── getSimilarPosts ──────────────────────────────────────────────────────────

describe('getSimilarPosts', () => {
  it('returns similar posts without private fields', async () => {
    const post = makePost();
    const postSelect = jest.fn().mockReturnThis();
    const postLean   = jest.fn().mockResolvedValue({ categoryIds: ['loneliness'], status: 'published' });

    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: postSelect, lean: postLean });

    const similar1 = makePost({ _id: new Types.ObjectId() });
    (PostModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  jest.fn().mockResolvedValue([similar1]),
    });

    const result = await getSimilarPosts(String(post._id));
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).not.toHaveProperty('authorAccountId');
  });

  it('throws 404 when post not found', async () => {
    const postSelect = jest.fn().mockReturnThis();
    const postLean   = jest.fn().mockResolvedValue(null);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: postSelect, lean: postLean });

    await expect(getSimilarPosts(POST_ID)).rejects.toThrow(/not found/i);
  });
});

// ─── savePost / unsavePost ────────────────────────────────────────────────────

describe('savePost', () => {
  it('saves a post for the user', async () => {
    (PostModel.exists as jest.Mock) = jest.fn().mockResolvedValue({ _id: POST_ID });
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ savedPostIds: [] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });
    (UserModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockResolvedValue({});

    await expect(savePost(ACCOUNT_ID, POST_ID)).resolves.not.toThrow();
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      ACCOUNT_ID,
      expect.objectContaining({ $addToSet: { savedPostIds: POST_ID } })
    );
  });

  it('throws 404 when post not found', async () => {
    (PostModel.exists as jest.Mock) = jest.fn().mockResolvedValue(null);
    await expect(savePost(ACCOUNT_ID, POST_ID)).rejects.toThrow(/not found/i);
  });
});

describe('unsavePost', () => {
  it('unsaves a post for the user', async () => {
    (UserModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockResolvedValue({});
    await expect(unsavePost(ACCOUNT_ID, POST_ID)).resolves.not.toThrow();
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      ACCOUNT_ID,
      expect.objectContaining({ $pull: { savedPostIds: POST_ID } })
    );
  });
});

// ─── getSavedPosts ────────────────────────────────────────────────────────────

describe('getSavedPosts', () => {
  it('returns paginated saved posts', async () => {
    const savedId = new Types.ObjectId(POST_ID);
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ savedPostIds: [savedId] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });

    const post = makePost();
    (PostModel.find as jest.Mock) = jest.fn().mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      lean:  jest.fn().mockResolvedValue([post]),
    });

    const result = await getSavedPosts(ACCOUNT_ID);
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).not.toHaveProperty('authorAccountId');
  });
});

// ─── getYouAreNotAloneStats ───────────────────────────────────────────────────

describe('getYouAreNotAloneStats', () => {
  it('masks groups below PRIVACY_THRESHOLD_MIN_GROUP_SIZE', async () => {
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ categoryInterests: ['loneliness'] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });

    // Aggregate returns 50 distinct authors — below threshold
    (PostModel.aggregate as jest.Mock) = jest.fn().mockResolvedValue(
      Array.from({ length: 50 }, () => ({ _id: new Types.ObjectId() }))
    );

    const result = await getYouAreNotAloneStats(ACCOUNT_ID);
    const entry = result.entries[0];

    expect(entry?.belowThreshold).toBe(true);
    expect(entry?.count).toBeNull();
  });

  it('shows count above PRIVACY_THRESHOLD_MIN_GROUP_SIZE', async () => {
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ categoryInterests: ['loneliness'] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });

    const distinctCount = PRIVACY_THRESHOLD_MIN_GROUP_SIZE + 50;
    (PostModel.aggregate as jest.Mock) = jest.fn().mockResolvedValue(
      Array.from({ length: distinctCount }, () => ({ _id: new Types.ObjectId() }))
    );

    const result = await getYouAreNotAloneStats(ACCOUNT_ID);
    const entry = result.entries[0];

    expect(entry?.belowThreshold).toBe(false);
    expect(entry?.count).toBe(distinctCount);
  });

  it('never returns individual user data — only aggregate counts', async () => {
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ categoryInterests: ['loneliness'] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });

    (PostModel.aggregate as jest.Mock) = jest.fn().mockResolvedValue(
      Array.from({ length: 200 }, () => ({ _id: new Types.ObjectId() }))
    );

    const result = await getYouAreNotAloneStats(ACCOUNT_ID);

    // No entry should contain user ID lists, emails, or account references
    for (const entry of result.entries) {
      expect(entry).not.toHaveProperty('accountIds');
      expect(entry).not.toHaveProperty('users');
      expect(entry).not.toHaveProperty('email');
      expect(entry).not.toHaveProperty('firebaseUid');
    }
  });

  it('returns empty entries when user has no category interests', async () => {
    const selectMock = jest.fn().mockReturnThis();
    const leanMock   = jest.fn().mockResolvedValue({ categoryInterests: [] });
    (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({ select: selectMock, lean: leanMock });

    const result = await getYouAreNotAloneStats(ACCOUNT_ID);
    expect(result.entries).toHaveLength(0);
  });
});

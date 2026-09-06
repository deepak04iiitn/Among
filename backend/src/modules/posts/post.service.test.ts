/**
 * post.service.test.ts — Unit tests for the post service.
 *
 * All external dependencies (MongoDB, moderation services) are mocked.
 * Tests verify:
 *  - Daily post limit enforced at boundary
 *  - Edit window enforced (before / after)
 *  - Author verification on edit and delete
 *  - Content scanner integration — critical violation blocks creation
 *  - Crisis detection — post created even if crisis, response includes flag
 *  - Privacy: authorAccountId NEVER in returned object
 *  - Deleted post returns redirect info
 *  - Cursor pagination returns correct page
 */
import { Types } from 'mongoose';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('./post.model');
jest.mock('../moderation/contentScanner.service');
jest.mock('../moderation/crisisDetection.service');

import { PostModel } from './post.model';
import * as scanner from '../moderation/contentScanner.service';
import * as crisis from '../moderation/crisisDetection.service';
import {
  createPost,
  editPost,
  deletePost,
  getPostById,
  getPostsByCategory,
} from './post.service';
import { POST_STATUS, POST_EXPERIENCE_STATE, POST_VISIBILITY } from '../../constants/postStates';
import { POST_MIN_CHARS, POST_MAX_CHARS, POST_EDIT_WINDOW_MS } from '../../constants/limits';

const mockScanner  = scanner  as jest.Mocked<typeof scanner>;
const mockCrisis   = crisis   as jest.Mocked<typeof crisis>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const AUTHOR_ID     = new Types.ObjectId().toString();
const OTHER_AUTHOR  = new Types.ObjectId().toString();
const POST_ID       = new Types.ObjectId().toString();
const ALIAS         = 'QuietRiver';
const AVATAR_SEED   = 'seed-abc123';
const VALID_BODY    = 'I have been struggling with loneliness since moving to a new city last year.';
const SHORT_BODY    = 'Too short.';
const LONG_BODY     = 'x'.repeat(POST_MAX_CHARS + 1);

const now           = new Date();
const FUTURE_EDIT   = new Date(now.getTime() + POST_EDIT_WINDOW_MS);
const PAST_EDIT     = new Date(now.getTime() - 1000);

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    _id:             new Types.ObjectId(POST_ID),
    authorAccountId: new Types.ObjectId(AUTHOR_ID),
    authorAlias:     ALIAS,
    authorAvatarSeed: AVATAR_SEED,
    body:            VALID_BODY,
    categoryIds:     ['loneliness'],
    state:           POST_EXPERIENCE_STATE.CURRENT,
    visibilityScope: POST_VISIBILITY.BROAD,
    status:          POST_STATUS.PUBLISHED,
    publishedAt:     now,
    editableUntil:   FUTURE_EDIT,
    editedAt:        null,
    deletedAt:       null,
    moderationNotes: null,
    contentFlags:    [],
    reactionCounts:  { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
    createdAt:       now,
    updatedAt:       now,
    save:            jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockCleanScan() {
  mockScanner.scanPost.mockReturnValue({
    hasCriticalViolations: false,
    hasWarnings:           false,
    detectedPatterns:      [],
  });
}

function mockCleanCrisis() {
  mockCrisis.detectCrisisContent.mockReturnValue({
    isCrisis:   false,
    crisisType: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCleanScan();
  mockCleanCrisis();
});

// ─── createPost ───────────────────────────────────────────────────────────────

describe('createPost', () => {
  beforeEach(() => {
    (PostModel.prototype.save as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  it('creates a post with correct fields', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

    const savedPost = makePost();
    jest.spyOn(PostModel.prototype, 'save').mockResolvedValue(savedPost as any);

    // Use a factory mock for the PostModel constructor
    const MockPostModel = PostModel as unknown as jest.MockedClass<typeof PostModel>;
    MockPostModel.mockImplementation(() => savedPost as any);
    (PostModel.countDocuments as jest.Mock).mockResolvedValue(0);

    // We'll check the result shape directly via the service behaviour
    // by not mocking constructor, but letting it run and checking the public shape
    const result = await createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
      body:            VALID_BODY,
      categoryIds:     ['loneliness'],
      state:           POST_EXPERIENCE_STATE.CURRENT,
      visibilityScope: POST_VISIBILITY.BROAD,
    });

    expect(result.post.body).toBe(VALID_BODY);
    expect(result.crisisDetected).toBe(false);
    expect(result.safetyWarnings).toHaveLength(0);
  });

  it('rejects body shorter than POST_MIN_CHARS', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

    await expect(
      createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
        body: SHORT_BODY,
        categoryIds: [],
        state: POST_EXPERIENCE_STATE.CURRENT,
        visibilityScope: POST_VISIBILITY.BROAD,
      })
    ).rejects.toThrow(new RegExp(`at least ${POST_MIN_CHARS}`));
  });

  it('rejects body longer than POST_MAX_CHARS', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

    await expect(
      createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
        body: LONG_BODY,
        categoryIds: [],
        state: POST_EXPERIENCE_STATE.CURRENT,
        visibilityScope: POST_VISIBILITY.BROAD,
      })
    ).rejects.toThrow(/not exceed/);
  });

  it('enforces daily post limit', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1); // Already at limit

    await expect(
      createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
        body: VALID_BODY,
        categoryIds: [],
        state: POST_EXPERIENCE_STATE.CURRENT,
        visibilityScope: POST_VISIBILITY.BROAD,
      })
    ).rejects.toThrow(/tomorrow|limit|already shared/i);
  });

  it('blocks publish when content has critical violations', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);
    mockScanner.scanPost.mockReturnValue({
      hasCriticalViolations: true,
      hasWarnings:           false,
      detectedPatterns:      ['criticalContent'],
    });

    await expect(
      createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
        body: VALID_BODY,
        categoryIds: [],
        state: POST_EXPERIENCE_STATE.CURRENT,
        visibilityScope: POST_VISIBILITY.BROAD,
      })
    ).rejects.toThrow(/policy violation/i);
  });

  it('creates post even when crisis is detected, and returns flag', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);
    mockCrisis.detectCrisisContent.mockReturnValue({
      isCrisis:   true,
      crisisType: 'self_harm',
    });

    const savedPost = makePost();
    const MockPostModel = PostModel as unknown as jest.MockedClass<typeof PostModel>;
    MockPostModel.mockImplementation(() => savedPost as any);
    (savedPost.save as jest.Mock).mockResolvedValue(undefined);

    const result = await createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
      body: VALID_BODY,
      categoryIds: [],
      state: POST_EXPERIENCE_STATE.CURRENT,
      visibilityScope: POST_VISIBILITY.BROAD,
    });

    expect(result.crisisDetected).toBe(true);
    expect(result.crisisType).toBe('self_harm');
    // Post was still created
    expect(result.post).toBeDefined();
  });

  it('never includes authorAccountId in returned post', async () => {
    (PostModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

    const savedPost = makePost();
    const MockPostModel = PostModel as unknown as jest.MockedClass<typeof PostModel>;
    MockPostModel.mockImplementation(() => savedPost as any);
    (savedPost.save as jest.Mock).mockResolvedValue(undefined);

    const result = await createPost(AUTHOR_ID, ALIAS, AVATAR_SEED, {
      body: VALID_BODY,
      categoryIds: [],
      state: POST_EXPERIENCE_STATE.CURRENT,
      visibilityScope: POST_VISIBILITY.BROAD,
    });

    expect(result.post).not.toHaveProperty('authorAccountId');
    expect(result.post).not.toHaveProperty('moderationNotes');
    expect(result.post).not.toHaveProperty('contentFlags');
  });
});

// ─── editPost ─────────────────────────────────────────────────────────────────

describe('editPost', () => {
  it('edits post body when within edit window and correct author', async () => {
    const post = makePost({ editableUntil: FUTURE_EDIT });
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    const result = await editPost(AUTHOR_ID, POST_ID, { body: 'Updated body — something longer than twenty chars' });

    expect(post.save).toHaveBeenCalled();
    expect(result.body).toBe('Updated body — something longer than twenty chars');
    expect(result).not.toHaveProperty('authorAccountId');
  });

  it('rejects edit when edit window has passed', async () => {
    const post = makePost({ editableUntil: PAST_EDIT });
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    await expect(editPost(AUTHOR_ID, POST_ID, { body: 'Updated longer than twenty chars' })).rejects.toThrow(/edit window/i);
  });

  it('rejects edit when not the author', async () => {
    const post = makePost({ editableUntil: FUTURE_EDIT });
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    await expect(editPost(OTHER_AUTHOR, POST_ID, { body: 'Updated longer than twenty chars' })).rejects.toThrow(/own posts/i);
  });

  it('rejects edit body shorter than minimum', async () => {
    const post = makePost({ editableUntil: FUTURE_EDIT });
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    await expect(editPost(AUTHOR_ID, POST_ID, { body: SHORT_BODY })).rejects.toThrow(/at least/i);
  });
});

// ─── deletePost ───────────────────────────────────────────────────────────────

describe('deletePost', () => {
  it('soft-deletes post when correct author', async () => {
    const post = makePost();
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    await deletePost(AUTHOR_ID, POST_ID);

    expect(post.status).toBe(POST_STATUS.DELETED_BY_USER);
    expect(post.deletedAt).toBeInstanceOf(Date);
    expect(post.save).toHaveBeenCalled();
  });

  it('rejects deletion when not the author', async () => {
    const post = makePost();
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(post);

    await expect(deletePost(OTHER_AUTHOR, POST_ID)).rejects.toThrow(/own posts/i);
  });

  it('throws 404 when post not found', async () => {
    (PostModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

    await expect(deletePost(AUTHOR_ID, POST_ID)).rejects.toThrow(/not found/i);
  });
});

// ─── getPostById ─────────────────────────────────────────────────────────────

describe('getPostById', () => {
  it('returns public post without private fields', async () => {
    const post = makePost();
    const mockLean = jest.fn().mockResolvedValue(post);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getPostById(POST_ID, AUTHOR_ID);

    expect(result).not.toHaveProperty('authorAccountId');
    expect(result).not.toHaveProperty('moderationNotes');
    expect(result).not.toHaveProperty('contentFlags');
  });

  it('marks post as own when requesting user is the author', async () => {
    const post = makePost();
    const mockLean = jest.fn().mockResolvedValue(post);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getPostById(POST_ID, AUTHOR_ID);
    expect(result).toHaveProperty('isOwnPost', true);
  });

  it('marks post as not own for other users', async () => {
    const post = makePost();
    const mockLean = jest.fn().mockResolvedValue(post);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getPostById(POST_ID, OTHER_AUTHOR);
    expect(result).toHaveProperty('isOwnPost', false);
  });

  it('returns redirect info for deleted post (SEO FR-SEO-19)', async () => {
    const post = makePost({ status: POST_STATUS.DELETED_BY_USER });
    const mockLean = jest.fn().mockResolvedValue(post);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getPostById(POST_ID, null);

    expect(result).toHaveProperty('status', POST_STATUS.DELETED_BY_USER);
    expect(result).toHaveProperty('redirectCategoryId');
  });

  it('returns redirect info for moderated post', async () => {
    const post = makePost({ status: POST_STATUS.REMOVED_BY_MODERATION });
    const mockLean = jest.fn().mockResolvedValue(post);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    const result = await getPostById(POST_ID, null);
    expect(result).toHaveProperty('status', POST_STATUS.REMOVED_BY_MODERATION);
  });

  it('throws 404 when post does not exist', async () => {
    const mockLean = jest.fn().mockResolvedValue(null);
    (PostModel.findById as jest.Mock) = jest.fn().mockReturnValue({ lean: mockLean });

    await expect(getPostById(POST_ID, null)).rejects.toThrow(/not found/i);
  });
});

// ─── getPostsByCategory — cursor pagination ────────────────────────────────

describe('getPostsByCategory', () => {
  it('returns posts and nextCursor when more items exist', async () => {
    const posts = Array.from({ length: 21 }, (_, i) =>
      makePost({ _id: new Types.ObjectId(), publishedAt: new Date(Date.now() - i * 1000), createdAt: new Date() })
    );

    const chain = {
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  jest.fn().mockResolvedValue(posts),
    };
    (PostModel.find as jest.Mock) = jest.fn().mockReturnValue(chain);

    const result = await getPostsByCategory('loneliness', { limit: 20 });

    expect(result.posts).toHaveLength(20);
    expect(result.nextCursor).not.toBeNull();
  });

  it('returns null nextCursor on last page', async () => {
    const posts = Array.from({ length: 5 }, (_, i) =>
      makePost({ _id: new Types.ObjectId(), publishedAt: new Date(Date.now() - i * 1000), createdAt: new Date() })
    );

    const chain = {
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  jest.fn().mockResolvedValue(posts),
    };
    (PostModel.find as jest.Mock) = jest.fn().mockReturnValue(chain);

    const result = await getPostsByCategory('loneliness', { limit: 20 });

    expect(result.posts).toHaveLength(5);
    expect(result.nextCursor).toBeNull();
  });

  it('applies cursor from previous page', async () => {
    const chain = {
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean:  jest.fn().mockResolvedValue([]),
    };
    (PostModel.find as jest.Mock) = jest.fn().mockReturnValue(chain);

    // Encode a cursor
    const cursor = Buffer.from(JSON.stringify({ publishedAt: new Date().toISOString() })).toString('base64url');
    await getPostsByCategory('loneliness', { cursor, limit: 20 });

    const findArgs = (PostModel.find as jest.Mock).mock.calls[0];
    expect(findArgs[0]).toHaveProperty('publishedAt');
  });
});

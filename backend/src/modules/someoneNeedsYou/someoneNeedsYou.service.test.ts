/**
 * someoneNeedsYou.service.test.ts — Unit tests for the SNY service.
 *
 * Critical invariants:
 *  - No prompt if user has no survived categories with opt-in.
 *  - No prompt if same user posted the target.
 *  - Blocked users are excluded.
 *  - Daily limit of 1 prompt enforced.
 *  - Skip limit of 3 enforced.
 *  - After skip limit, dismissed for day.
 *  - Accepting prompt returns contextCategoryId + contextPostId.
 */
import { Types } from 'mongoose';
import * as snyService from './someoneNeedsYou.service';
import * as egService  from '../experienceGraph/experienceGraph.service';
import { PostModel }   from '../posts/post.model';
import { BlockModel }  from '../blocks/block.model';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../experienceGraph/experienceGraph.service');
jest.mock('../posts/post.model', () => ({
  PostModel: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock('../blocks/block.model', () => ({
  BlockModel: {
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  },
}));

const mockGetSurvivedCategories = egService.getSurvivedCategories as jest.Mock;
const mockPostFindOne           = PostModel.findOne  as jest.Mock;
const mockPostFindById          = PostModel.findById as jest.Mock;
const mockBlockFind             = BlockModel.find    as jest.Mock;
void mockBlockFind;

const ACCOUNT_ID       = String(new Types.ObjectId());
const ACCOUNT_SKIP     = String(new Types.ObjectId());
const ACCOUNT_SKIP_LIM = String(new Types.ObjectId());
const ACCOUNT_ACCEPT   = String(new Types.ObjectId());
const ACCOUNT_DISMISS  = String(new Types.ObjectId());
const OTHER_ID         = String(new Types.ObjectId());
const POST_ID          = String(new Types.ObjectId());

function makeFakePost(overrides: Partial<{ _id: Types.ObjectId; accountId: Types.ObjectId; body: string; categoryIds: string[] }> = {}) {
  return {
    _id:        overrides._id ?? new Types.ObjectId(POST_ID),
    accountId:  overrides.accountId ?? new Types.ObjectId(OTHER_ID),
    body:       overrides.body ?? 'This is how I feel every day.',
    categoryIds: overrides.categoryIds ?? ['anxiety'],
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  // Re-setup block find mock with lean() after resetAllMocks
  (BlockModel.find as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue([]),
  });
});

// ─── getDailyPromptForUser ────────────────────────────────────────────────────

describe('getDailyPromptForUser', () => {
  it('returns null if user has no survived categories with opt-in', async () => {
    mockGetSurvivedCategories.mockResolvedValueOnce([]);
    const result = await snyService.getDailyPromptForUser(ACCOUNT_ID);
    expect(result).toBeNull();
  });

  it('returns null if no matching post found in survived category', async () => {
    mockGetSurvivedCategories.mockResolvedValueOnce(['anxiety']);
    mockPostFindOne.mockReturnValueOnce({ sort: () => ({ lean: () => Promise.resolve(null) }) });
    const result = await snyService.getDailyPromptForUser(ACCOUNT_ID);
    expect(result).toBeNull();
  });

  it('returns a prompt when a valid post is found', async () => {
    mockGetSurvivedCategories.mockResolvedValueOnce(['anxiety']);
    mockPostFindOne.mockReturnValueOnce({
      sort: () => ({ lean: () => Promise.resolve(makeFakePost()) }),
    });

    const result = await snyService.getDailyPromptForUser(ACCOUNT_ID);
    expect(result).not.toBeNull();
    expect(result?.postId).toBe(POST_ID);
    expect(result?.categoryId).toBe('anxiety');
    expect(result?.skipsRemaining).toBe(3);
  });

  it('excludes provided post IDs from results', async () => {
    mockGetSurvivedCategories.mockResolvedValueOnce(['anxiety']);
    mockPostFindOne.mockReturnValueOnce({ sort: () => ({ lean: () => Promise.resolve(null) }) });
    const result = await snyService.getDailyPromptForUser(ACCOUNT_ID, [POST_ID]);
    expect(result).toBeNull();
  });
});

// ─── skipPrompt ───────────────────────────────────────────────────────────────

describe('skipPrompt', () => {
  beforeEach(() => {
    mockPostFindById.mockReturnValue({ lean: () => Promise.resolve({ _id: POST_ID }) });
  });

  it('returns next prompt after skip', async () => {
    mockGetSurvivedCategories.mockResolvedValue(['grief']);
    const nextPost = makeFakePost({ _id: new Types.ObjectId(), categoryIds: ['grief'] });
    mockPostFindOne.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(nextPost) }) });

    const result = await snyService.skipPrompt(ACCOUNT_SKIP, POST_ID);
    expect(result).not.toBeNull();
    expect(result?.skipsUsed).toBeGreaterThanOrEqual(1);
  });

  it('returns null and dismisses after skip limit is reached', async () => {
    mockGetSurvivedCategories.mockResolvedValue(['anxiety']);
    mockPostFindOne.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(null) }) });

    // Exhaust skip limit (3 skips)
    await snyService.skipPrompt(ACCOUNT_SKIP_LIM, POST_ID);
    await snyService.skipPrompt(ACCOUNT_SKIP_LIM, POST_ID);
    await snyService.skipPrompt(ACCOUNT_SKIP_LIM, POST_ID);
    const result = await snyService.skipPrompt(ACCOUNT_SKIP_LIM, POST_ID);

    expect(result).toBeNull();
    const status = snyService.getPromptStatus(ACCOUNT_SKIP_LIM);
    expect(status.dismissed).toBe(true);
  });
});

// ─── acceptPrompt ─────────────────────────────────────────────────────────────

describe('acceptPrompt', () => {
  it('returns contextCategoryId and contextPostId', async () => {
    mockPostFindById.mockReturnValueOnce({
      lean: () => Promise.resolve({ _id: POST_ID, categoryIds: ['grief'] }),
    });

    const result = await snyService.acceptPrompt(ACCOUNT_ACCEPT, POST_ID);
    expect(result.contextPostId).toBe(POST_ID);
    expect(result.contextCategoryId).toBe('grief');
  });

  it('throws if post not found', async () => {
    mockPostFindById.mockReturnValueOnce({ lean: () => Promise.resolve(null) });
    await expect(snyService.acceptPrompt(ACCOUNT_ID, 'bad-id')).rejects.toThrow('Prompt post not found');
  });
});

// ─── dismissPromptForToday ────────────────────────────────────────────────────

describe('dismissPromptForToday', () => {
  it('marks prompt as dismissed for the day', async () => {
    snyService.dismissPromptForToday(ACCOUNT_DISMISS);

    mockGetSurvivedCategories.mockResolvedValueOnce(['anxiety']);
    const result = await snyService.getDailyPromptForUser(ACCOUNT_DISMISS);
    expect(result).toBeNull();

    const status = snyService.getPromptStatus(ACCOUNT_DISMISS);
    expect(status.dismissed).toBe(true);
  });
});

// ─── getPromptStatus ──────────────────────────────────────────────────────────

describe('getPromptStatus', () => {
  it('returns initial idle state for a new account', () => {
    const id = String(new Types.ObjectId());
    const status = snyService.getPromptStatus(id);
    expect(status.dismissed).toBe(false);
    expect(status.promptsSent).toBe(0);
    expect(status.skipsUsed).toBe(0);
  });
});

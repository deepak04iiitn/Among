/**
 * discoveryThunks.test.ts — Unit tests for discovery thunks.
 */
import { configureStore } from '@reduxjs/toolkit';
import discoveryReducer from './discoverySlice';
import {
  fetchHomeFeedThunk,
  fetchCategoryFeedThunk,
  fetchYanaStatsThunk,
  fetchSavedPostsThunk,
  savePostThunk,
  unsavePostThunk,
} from './discoveryThunks';

jest.mock('../../lib/discoveryApi');
import * as discoveryApi from '../../lib/discoveryApi';
const mockApi = discoveryApi as jest.Mocked<typeof discoveryApi>;

// ─── Store factory ────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { discovery: discoveryReducer } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDispatch = (action: any) => any;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeApiPost(id = 'post-1') {
  return {
    id,
    authorAlias: 'Alias',
    authorAvatarSeed: 'seed',
    body: 'Post body',
    categoryIds: ['loneliness'],
    state: 'current',
    visibilityScope: 'broad',
    status: 'published',
    publishedAt: new Date().toISOString(),
    editableUntil: new Date().toISOString(),
    editedAt: null,
    reactionCounts: {
      current: 0, past: 0, considering: 0,
      same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
    },
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── fetchHomeFeedThunk ───────────────────────────────────────────────────────

describe('fetchHomeFeedThunk', () => {
  it('sets primary and secondary posts in state', async () => {
    const primary   = makeApiPost('primary');
    const secondary = [makeApiPost('sec-1'), makeApiPost('sec-2')];

    mockApi.getHomeFeed.mockResolvedValue({ primary, secondary });

    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchHomeFeedThunk());

    const state = store.getState().discovery;
    expect(state.primaryPost?.id).toBe('primary');
    expect(state.secondaryPosts).toHaveLength(2);
    expect(state.feedFetched).toBe(true);
    expect(state.feedLoading).toBe(false);
  });

  it('sets feedError on failure', async () => {
    mockApi.getHomeFeed.mockRejectedValue(new Error('Network'));
    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchHomeFeedThunk());
    expect(store.getState().discovery.feedError).toBeTruthy();
    expect(store.getState().discovery.feedLoading).toBe(false);
  });
});

// ─── fetchCategoryFeedThunk ───────────────────────────────────────────────────

describe('fetchCategoryFeedThunk', () => {
  it('loads category posts', async () => {
    mockApi.getCategoryFeed.mockResolvedValue({
      posts: [makeApiPost()],
      nextCursor: null,
    } as never);

    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchCategoryFeedThunk({ slug: 'loneliness' }));

    const state = store.getState().discovery;
    expect(state.categoryPosts).toHaveLength(1);
    expect(state.activeCategory).toBe('loneliness');
  });

  it('appends posts when append=true', async () => {
    mockApi.getCategoryFeed.mockResolvedValue({ posts: [makeApiPost('p1')], nextCursor: null } as never);
    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchCategoryFeedThunk({ slug: 'loneliness' }));

    mockApi.getCategoryFeed.mockResolvedValue({ posts: [makeApiPost('p2')], nextCursor: null } as never);
    await (store.dispatch as AnyDispatch)(fetchCategoryFeedThunk({ slug: 'loneliness', append: true }));

    expect(store.getState().discovery.categoryPosts).toHaveLength(2);
  });
});

// ─── fetchYanaStatsThunk ──────────────────────────────────────────────────────

describe('fetchYanaStatsThunk', () => {
  it('loads YANA stats', async () => {
    mockApi.getYanaStats.mockResolvedValue({
      entries: [{ categoryId: 'loneliness', displayName: 'Loneliness', count: 250, belowThreshold: false }],
    });

    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchYanaStatsThunk());

    expect(store.getState().discovery.yanaStats).toHaveLength(1);
    expect(store.getState().discovery.yanaStats[0]?.count).toBe(250);
  });
});

// ─── fetchSavedPostsThunk ─────────────────────────────────────────────────────

describe('fetchSavedPostsThunk', () => {
  it('loads saved posts', async () => {
    mockApi.getSavedPosts.mockResolvedValue({ posts: [makeApiPost()], nextCursor: null } as never);

    const store = makeStore();
    await (store.dispatch as AnyDispatch)(fetchSavedPostsThunk({}));

    expect(store.getState().discovery.savedPosts).toHaveLength(1);
  });
});

// ─── savePostThunk / unsavePostThunk ──────────────────────────────────────────

describe('savePostThunk', () => {
  it('calls the API', async () => {
    mockApi.savePost.mockResolvedValue(undefined);
    const store = makeStore();
    await (store.dispatch as AnyDispatch)(savePostThunk('post-123'));
    expect(mockApi.savePost).toHaveBeenCalledWith('post-123');
  });
});

describe('unsavePostThunk', () => {
  it('calls the API', async () => {
    mockApi.unsavePost.mockResolvedValue(undefined);
    const store = makeStore();
    await (store.dispatch as AnyDispatch)(unsavePostThunk('post-123'));
    expect(mockApi.unsavePost).toHaveBeenCalledWith('post-123');
  });
});


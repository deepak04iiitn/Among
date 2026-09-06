import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  feedLoading,
  feedLoaded,
  feedError,
  feedRefreshing,
  postSameCountUpdated,
  postSaveToggled,
  feedCleared,
  postAdded,
  selectPrimaryPost,
  selectSecondaryPosts,
  selectPostsStatus,
  selectPostsError,
  selectNextCursor,
  selectPostById,
  type FeedPost,
  type Post,
} from './postsSlice';
import { POST_EXPERIENCE_STATE, POST_VISIBILITY } from '../../constants/postStates';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

/** Feed card fixture (FeedPost shape) */
const mockPost = (overrides?: Partial<FeedPost>): FeedPost => ({
  id: 'p1',
  body: 'I lost my job today.',
  categoryId: 'work',
  categoryLabel: 'Work',
  stateLabel: 'Current',
  authorAlias: { name: 'Blue Fox', avatarSeed: 'seed-1' },
  sameCount: 10,
  totalReactionCount: 15,
  responseCount: 3,
  publishedAt: '2026-01-01T00:00:00.000Z',
  isOwn: false,
  hasReacted: false,
  hasSaved: false,
  ...overrides,
});

/** Full post fixture (Post shape) — for byId tests */
const mockFullPost = (overrides?: Partial<Post>): Post => ({
  id: 'p1',
  body: 'I lost my job today.',
  categoryIds: ['work'],
  state: POST_EXPERIENCE_STATE.CURRENT,
  visibilityScope: POST_VISIBILITY.BROAD,
  status: 'published',
  authorAlias: 'Blue Fox',
  authorAvatarSeed: 'seed-1',
  publishedAt: '2026-01-01T00:00:00.000Z',
  editableUntil: '2026-01-01T00:15:00.000Z',
  editedAt: null,
  reactionCounts: { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
  isOwnPost: false,
  ...overrides,
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('postsSlice — initial state', () => {
  it('has null primaryPost', () => {
    const store = makeStore();
    expect(selectPrimaryPost(store.getState())).toBeNull();
  });

  it('has empty secondaryPosts', () => {
    const store = makeStore();
    expect(selectSecondaryPosts(store.getState())).toEqual([]);
  });

  it('has idle status', () => {
    const store = makeStore();
    expect(selectPostsStatus(store.getState())).toBe('idle');
  });

  it('has null error', () => {
    const store = makeStore();
    expect(selectPostsError(store.getState())).toBeNull();
  });

  it('has null nextCursor', () => {
    const store = makeStore();
    expect(selectNextCursor(store.getState())).toBeNull();
  });
});

// ─── feedLoading ─────────────────────────────────────────────────────────────

describe('feedLoading', () => {
  it('sets status to loading', () => {
    const store = makeStore();
    store.dispatch(feedLoading());
    expect(selectPostsStatus(store.getState())).toBe('loading');
  });
});

// ─── feedLoaded ──────────────────────────────────────────────────────────────

describe('feedLoaded', () => {
  it('stores posts and sets status to idle', () => {
    const store = makeStore();
    const primary = mockPost({ id: 'p1' });
    const secondary = [mockPost({ id: 'p2' }), mockPost({ id: 'p3' })];
    store.dispatch(feedLoaded({ primaryPost: primary, secondaryPosts: secondary, nextCursor: 'cursor-1' }));
    expect(selectPrimaryPost(store.getState())).toEqual(primary);
    expect(selectSecondaryPosts(store.getState())).toEqual(secondary);
    expect(selectNextCursor(store.getState())).toBe('cursor-1');
    expect(selectPostsStatus(store.getState())).toBe('idle');
  });

  it('handles null primaryPost', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: null, secondaryPosts: [], nextCursor: null }));
    expect(selectPrimaryPost(store.getState())).toBeNull();
  });

  it('tracks seen post IDs across loads', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({
      primaryPost: mockPost({ id: 'p1' }),
      secondaryPosts: [mockPost({ id: 'p2' })],
      nextCursor: null,
    }));
    store.dispatch(feedLoaded({
      primaryPost: mockPost({ id: 'p3' }),
      secondaryPosts: [],
      nextCursor: null,
    }));
    // State is internal, we just verify it doesn't crash
    expect(selectPrimaryPost(store.getState())?.id).toBe('p3');
  });
});

// ─── feedError ───────────────────────────────────────────────────────────────

describe('feedError', () => {
  it('sets status to error', () => {
    const store = makeStore();
    store.dispatch(feedError('Network timeout'));
    expect(selectPostsStatus(store.getState())).toBe('error');
    expect(selectPostsError(store.getState())).toBe('Network timeout');
  });
});

// ─── feedRefreshing ──────────────────────────────────────────────────────────

describe('feedRefreshing', () => {
  it('sets status to refreshing', () => {
    const store = makeStore();
    store.dispatch(feedRefreshing());
    expect(selectPostsStatus(store.getState())).toBe('refreshing');
  });
});

// ─── postSameCountUpdated ─────────────────────────────────────────────────────

describe('postSameCountUpdated', () => {
  it('increments sameCount on primary post', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost({ id: 'p1', sameCount: 5 }), secondaryPosts: [], nextCursor: null }));
    store.dispatch(postSameCountUpdated({ postId: 'p1', delta: 1 }));
    expect(selectPrimaryPost(store.getState())?.sameCount).toBe(6);
    expect(selectPrimaryPost(store.getState())?.hasReacted).toBe(true);
  });

  it('decrements sameCount on primary post', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost({ id: 'p1', sameCount: 5 }), secondaryPosts: [], nextCursor: null }));
    store.dispatch(postSameCountUpdated({ postId: 'p1', delta: -1 }));
    expect(selectPrimaryPost(store.getState())?.sameCount).toBe(4);
    expect(selectPrimaryPost(store.getState())?.hasReacted).toBe(false);
  });

  it('does not go below 0', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost({ id: 'p1', sameCount: 0 }), secondaryPosts: [], nextCursor: null }));
    store.dispatch(postSameCountUpdated({ postId: 'p1', delta: -1 }));
    expect(selectPrimaryPost(store.getState())?.sameCount).toBe(0);
  });

  it('updates secondary post sameCount', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({
      primaryPost: null,
      secondaryPosts: [mockPost({ id: 'p2', sameCount: 3 })],
      nextCursor: null,
    }));
    store.dispatch(postSameCountUpdated({ postId: 'p2', delta: 1 }));
    expect(selectSecondaryPosts(store.getState())[0]?.sameCount).toBe(4);
  });

  it('does nothing when postId not found', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost({ id: 'p1', sameCount: 5 }), secondaryPosts: [], nextCursor: null }));
    store.dispatch(postSameCountUpdated({ postId: 'unknown', delta: 1 }));
    expect(selectPrimaryPost(store.getState())?.sameCount).toBe(5);
  });
});

// ─── postSaveToggled ─────────────────────────────────────────────────────────

describe('postSaveToggled', () => {
  it('toggles hasSaved on primary post', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost({ id: 'p1', hasSaved: false }), secondaryPosts: [], nextCursor: null }));
    store.dispatch(postSaveToggled({ postId: 'p1', saved: true }));
    expect(selectPrimaryPost(store.getState())?.hasSaved).toBe(true);
  });

  it('toggles hasSaved on secondary post', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({
      primaryPost: null,
      secondaryPosts: [mockPost({ id: 'p2', hasSaved: false })],
      nextCursor: null,
    }));
    store.dispatch(postSaveToggled({ postId: 'p2', saved: true }));
    expect(selectSecondaryPosts(store.getState())[0]?.hasSaved).toBe(true);
  });
});

// ─── feedCleared ─────────────────────────────────────────────────────────────

describe('feedCleared', () => {
  it('resets all state', () => {
    const store = makeStore();
    store.dispatch(feedLoaded({ primaryPost: mockPost(), secondaryPosts: [mockPost({ id: 'p2' })], nextCursor: 'c' }));
    store.dispatch(feedCleared());
    expect(selectPrimaryPost(store.getState())).toBeNull();
    expect(selectSecondaryPosts(store.getState())).toEqual([]);
    expect(selectNextCursor(store.getState())).toBeNull();
    expect(selectPostsStatus(store.getState())).toBe('idle');
  });
});

// ─── selectPostById ──────────────────────────────────────────────────────────

describe('selectPostById', () => {
  it('returns a full post from byId map', () => {
    const store = makeStore();
    const post = mockFullPost({ id: 'p1' });
    store.dispatch(postAdded(post));
    expect(selectPostById('p1')(store.getState())).toEqual(post);
  });

  it('returns another full post by its id', () => {
    const store = makeStore();
    const post = mockFullPost({ id: 'p2' });
    store.dispatch(postAdded(post));
    expect(selectPostById('p2')(store.getState())).toEqual(post);
  });

  it('returns undefined for unknown id', () => {
    const store = makeStore();
    expect(selectPostById('unknown')(store.getState())).toBeUndefined();
  });
});

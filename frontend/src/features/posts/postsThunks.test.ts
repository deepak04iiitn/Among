/**
 * postsThunks.test.ts — Unit tests for post Redux thunks.
 *
 * Critical test coverage:
 *  - createPostThunk success → post in state (byId + myPosts)
 *  - createPostThunk failure → error in state
 *  - Crisis flag → crisis banner action dispatched
 *  - deletePostThunk → post removed from byId
 *  - editPostThunk → post body updated
 */
import { configureStore } from '@reduxjs/toolkit';
import postsReducer from './postsSlice';
import {
  createPostThunk,
  editPostThunk,
  deletePostThunk,
  fetchPostThunk,
} from './postsThunks';
import { POST_EXPERIENCE_STATE, POST_VISIBILITY } from '../../constants/postStates';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../lib/postsApi');

import * as postsApi from '../../lib/postsApi';

const mockApi = postsApi as jest.Mocked<typeof postsApi>;

// ─── Test store factory ───────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { posts: postsReducer } });
}

type TestStore = ReturnType<typeof makeStore>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const POST_ID = 'post-123';

function makeApiPost(overrides: Partial<ReturnType<typeof buildApiPost>> = {}) {
  return { ...buildApiPost(), ...overrides };
}

function buildApiPost() {
  return {
    id:              POST_ID,
    body:            'A shared experience longer than twenty characters.',
    categoryIds:     ['loneliness'],
    state:           POST_EXPERIENCE_STATE.CURRENT,
    visibilityScope: POST_VISIBILITY.BROAD,
    status:          'published',
    authorAlias:     'QuietRiver',
    authorAvatarSeed: 'seed-xyz',
    publishedAt:     new Date().toISOString(),
    editableUntil:   new Date(Date.now() + 900_000).toISOString(),
    editedAt:        null as string | null,
    reactionCounts:  { current: 0, past: 0, considering: 0, same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0 },
    isOwnPost:       true,
  };
}

const CREATE_INPUT = {
  body:            'A shared experience longer than twenty characters.',
  categoryIds:     ['loneliness'],
  state:           POST_EXPERIENCE_STATE.CURRENT,
  visibilityScope: POST_VISIBILITY.BROAD,
};

// ─── createPostThunk ──────────────────────────────────────────────────────────

describe('createPostThunk', () => {
  let store: TestStore;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();
  });

  it('adds post to byId and myPosts on success', async () => {
    mockApi.createPost.mockResolvedValue({
      post:            makeApiPost(),
      crisisDetected:  false,
      crisisResources: null,
      safetyWarnings:  [],
    });

    await store.dispatch(createPostThunk(CREATE_INPUT));

    const state = store.getState().posts;
    expect(state.byId[POST_ID]).toBeDefined();
    expect(state.myPosts).toContain(POST_ID);
    expect(state.submitting).toBe(false);
    expect(state.composeError).toBeNull();
  });

  it('sets composeError on failure', async () => {
    mockApi.createPost.mockRejectedValue(new Error('Network error'));

    await store.dispatch(createPostThunk(CREATE_INPUT));

    const state = store.getState().posts;
    expect(state.submitting).toBe(false);
    expect(state.composeError).toBe('Network error');
    expect(Object.keys(state.byId)).toHaveLength(0);
  });

  it('dispatches crisis banner action when crisis detected', async () => {
    const resources = [{ type: 'self_harm', name: 'Crisis Line', phone: '988', description: 'Help', url: '' }];
    mockApi.createPost.mockResolvedValue({
      post:            makeApiPost(),
      crisisDetected:  true,
      crisisResources: resources,
      safetyWarnings:  [],
    });

    const dispatched: unknown[] = [];
    const storeWithMiddleware = configureStore({
      reducer: { posts: postsReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
          (_store) => (next) => (action) => {
            dispatched.push(action);
            return next(action as Parameters<typeof next>[0]);
          }
        ),
    });

    await storeWithMiddleware.dispatch(createPostThunk(CREATE_INPUT));

    // Verify crisis banner action was dispatched
    const crisisAction = dispatched.find(
      (a) => typeof a === 'object' && a !== null && (a as { type: string }).type === 'notifications/showCrisisBanner'
    );
    expect(crisisAction).toBeDefined();
  });

  it('does NOT dispatch crisis banner when crisis is not detected', async () => {
    mockApi.createPost.mockResolvedValue({
      post:            makeApiPost(),
      crisisDetected:  false,
      crisisResources: null,
      safetyWarnings:  [],
    });

    const dispatched: unknown[] = [];
    const storeWithMiddleware = configureStore({
      reducer: { posts: postsReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
          (_store) => (next) => (action) => {
            dispatched.push(action);
            return next(action as Parameters<typeof next>[0]);
          }
        ),
    });

    await storeWithMiddleware.dispatch(createPostThunk(CREATE_INPUT));

    const crisisAction = dispatched.find(
      (a) => typeof a === 'object' && a !== null && (a as { type: string }).type === 'notifications/showCrisisBanner'
    );
    expect(crisisAction).toBeUndefined();
  });

  it('clears draftPost on success', async () => {
    mockApi.createPost.mockResolvedValue({
      post:            makeApiPost(),
      crisisDetected:  false,
      crisisResources: null,
      safetyWarnings:  [],
    });

    await store.dispatch(createPostThunk(CREATE_INPUT));

    expect(store.getState().posts.draftPost).toBeNull();
  });
});

// ─── editPostThunk ────────────────────────────────────────────────────────────

describe('editPostThunk', () => {
  let store: TestStore;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();

    // Pre-load post into store
    store.dispatch({ type: 'posts/postAdded', payload: makeApiPost() });
  });

  it('updates post body in byId', async () => {
    const newBody = 'Updated body with more than twenty characters here.';
    mockApi.editPost.mockResolvedValue(makeApiPost({ body: newBody }));

    await store.dispatch(editPostThunk({ id: POST_ID, body: newBody }));

    expect(store.getState().posts.byId[POST_ID]?.body).toBe(newBody);
  });

  it('does not affect other posts on edit', async () => {
    const OTHER_ID = 'other-post-456';
    store.dispatch({ type: 'posts/postAdded', payload: makeApiPost({ id: OTHER_ID }) });

    const newBody = 'Updated body with more than twenty characters here.';
    mockApi.editPost.mockResolvedValue(makeApiPost({ body: newBody }));

    await store.dispatch(editPostThunk({ id: POST_ID, body: newBody }));

    expect(store.getState().posts.byId[OTHER_ID]).toBeDefined();
  });
});

// ─── deletePostThunk ──────────────────────────────────────────────────────────

describe('deletePostThunk', () => {
  let store: TestStore;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();

    store.dispatch({ type: 'posts/postAdded', payload: makeApiPost() });
  });

  it('removes post from byId', async () => {
    mockApi.deletePost.mockResolvedValue(undefined);

    await store.dispatch(deletePostThunk(POST_ID));

    expect(store.getState().posts.byId[POST_ID]).toBeUndefined();
  });

  it('removes post from myPosts', async () => {
    mockApi.deletePost.mockResolvedValue(undefined);

    await store.dispatch(deletePostThunk(POST_ID));

    expect(store.getState().posts.myPosts).not.toContain(POST_ID);
  });
});

// ─── fetchPostThunk ───────────────────────────────────────────────────────────

describe('fetchPostThunk', () => {
  let store: TestStore;

  beforeEach(() => {
    store = makeStore();
    jest.clearAllMocks();
  });

  it('adds published post to byId', async () => {
    mockApi.getPost.mockResolvedValue(makeApiPost());

    await store.dispatch(fetchPostThunk(POST_ID));

    expect(store.getState().posts.byId[POST_ID]).toBeDefined();
  });

  it('does not crash on deleted post redirect response', async () => {
    mockApi.getPost.mockResolvedValue({ status: 'deleted_by_user', redirectCategoryId: 'loneliness' });

    await expect(store.dispatch(fetchPostThunk(POST_ID))).resolves.not.toThrow();
    // No post should be in byId (it was deleted)
    expect(store.getState().posts.byId[POST_ID]).toBeUndefined();
  });
});

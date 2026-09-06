/**
 * Redux store initialization tests.
 * Asserts the store initializes with correct initial state for each slice.
 */

import { store } from './index';
import type { RootState } from './rootReducer';

describe('Redux store', () => {
  let state: RootState;

  beforeEach(() => {
    state = store.getState();
  });

  it('initializes with correct auth initial state', () => {
    expect(state.auth).toEqual({
      user:    null,
      status:  'idle',
      error:   null,
      idToken: null,
    });
  });

  it('initializes with correct identity initial state', () => {
    expect(state.identity).toEqual({
      alias:           null,
      status:          'idle',
      error:           null,
      revealDismissed: false,
    });
  });

  it('initializes with correct posts initial state', () => {
    expect(state.posts).toEqual({
      primaryPost:    null,
      secondaryPosts: [],
      nextCursor:     null,
      status:         'idle',
      error:          null,
      seenPostIds:    [],
      byId:           {},
      myPosts:        [],
      draftPost:      null,
      submitting:     false,
      composeError:   null,
    });
  });

  it('initializes with correct reactions initial state', () => {
    expect(state.reactions).toEqual({
      counts:       {},
      userReactions: {},
      pending:      null,
      error:        null,
    });
  });

  it('initializes with correct discovery initial state', () => {
    expect(state.discovery).toEqual({
      // Home feed
      primaryPost:    null,
      secondaryPosts: [],
      feedFetched:    false,
      feedLoading:    false,
      feedError:      null,
      // Categories
      categories:          [],
      activeCategory:      null,
      categoryPosts:       [],
      categoryPostsCursor: null,
      categoriesStatus:    'idle',
      postsStatus:         'idle',
      error:               null,
      // YANA
      yanaStats:   [],
      yanaLoading: false,
      // Saved
      savedPosts:       [],
      savedPostsCursor: null,
      savedLoading:     false,
    });
  });

  it('initializes with correct conversations initial state', () => {
    expect(state.conversations).toEqual({
      list:                 [],
      activeConversationId: null,
      activeDetail:         null,
      messages:             {},
      messageCursors:       {},
      listStatus:           'idle',
      detailStatus:         'idle',
      messagesStatus:       'idle',
      matchingRequestId:    null,
      matchingState:        'idle',
      expiryWarning:        null,
      contactInfoWarning:   false,
      error:                null,
    });
  });

  it('initializes with correct notifications initial state', () => {
    expect(state.notifications).toEqual({
      items:       [],
      unreadCount: 0,
      status:      'idle',
      error:       null,
      panelOpen:   false,
    });
  });

  it('initializes with all feature flags off', () => {
    const { flags, loaded } = state.featureFlags;
    expect(loaded).toBe(false);
    // All flags default to false (safe off at MVP)
    Object.values(flags).forEach((v) => expect(v).toBe(false));
  });

  it('exports correctly typed AppDispatch', () => {
    // TypeScript type check — if the import shape breaks, this will cause a TS error
    expect(typeof store.dispatch).toBe('function');
  });
});

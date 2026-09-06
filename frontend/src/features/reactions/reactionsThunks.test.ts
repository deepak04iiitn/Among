/**
 * reactionsThunks.test.ts — Unit tests for reaction thunks.
 *
 * Critical coverage:
 *  - Optimistic update applies before API resolves
 *  - Rollback applies on API failure
 *  - Primary reaction exclusivity enforced in thunk
 *  - Crisis flag (if any) does not break normal flow
 */
import { configureStore } from '@reduxjs/toolkit';
import reactionsReducer from './reactionsSlice';
import {
  setReactionThunk,
  removeReactionThunk,
  fetchReactionForPostThunk,
} from './reactionsThunks';
import {
  PRIMARY_REACTION_IDS,
  SECONDARY_REACTION_IDS,
} from '../../constants/reactionTypes';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../lib/reactionsApi');
import * as reactionsApi from '../../lib/reactionsApi';
const mockApi = reactionsApi as jest.Mocked<typeof reactionsApi>;

// ─── Store factory ────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { reactions: reactionsReducer } });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const POST_ID = 'post-abc';
const ZERO_COUNTS = {
  current: 0, past: 0, considering: 0,
  same: 0, iUnderstand: 0, iLearned: 0, iDisagree: 0, tellMeMore: 0,
};

function makeSetResponse(primary: string | null = null, secondary: string[] = [], counts = ZERO_COUNTS) {
  return {
    counts: { ...counts },
    myReaction: {
      postId: POST_ID,
      primaryReaction:    primary as typeof PRIMARY_REACTION_IDS.CURRENT | null,
      secondaryReactions: secondary as typeof SECONDARY_REACTION_IDS.SAME[],
    },
  };
}

// ─── setReactionThunk ─────────────────────────────────────────────────────────

describe('setReactionThunk', () => {
  it('applies optimistic update immediately', async () => {
    // Use a promise that we can resolve manually
    let resolveApi!: (v: ReturnType<typeof makeSetResponse>) => void;
    const apiPromise = new Promise<ReturnType<typeof makeSetResponse>>((r) => { resolveApi = r; });
    mockApi.setReaction.mockReturnValue(apiPromise as any);

    const store = makeStore();
    const thunkPromise = store.dispatch(setReactionThunk({
      postId: POST_ID,
      primaryReaction: PRIMARY_REACTION_IDS.CURRENT,
    }));

    // Before API resolves — optimistic state should be updated
    const stateBeforeResolve = store.getState().reactions;
    expect(stateBeforeResolve.userReactions[POST_ID]).toContain(PRIMARY_REACTION_IDS.CURRENT);

    // Now resolve the API
    resolveApi(makeSetResponse(PRIMARY_REACTION_IDS.CURRENT, [], { ...ZERO_COUNTS, current: 1 }));
    await thunkPromise;
  });

  it('confirms counts from server after API resolves', async () => {
    mockApi.setReaction.mockResolvedValue(
      makeSetResponse(PRIMARY_REACTION_IDS.CURRENT, [], { ...ZERO_COUNTS, current: 5 }) as any
    );

    const store = makeStore();
    await store.dispatch(setReactionThunk({
      postId: POST_ID,
      primaryReaction: PRIMARY_REACTION_IDS.CURRENT,
    }));

    expect(store.getState().reactions.counts[POST_ID]?.current).toBe(5);
  });

  it('rolls back on API failure', async () => {
    mockApi.setReaction.mockRejectedValue(new Error('Network error'));

    const store = makeStore();

    // Pre-load some state
    store.dispatch({
      type: 'reactions/reactionCountsLoaded',
      payload: { postId: POST_ID, counts: { ...ZERO_COUNTS }, userReactions: [] },
    });

    await store.dispatch(setReactionThunk({
      postId: POST_ID,
      primaryReaction: PRIMARY_REACTION_IDS.CURRENT,
    }));

    // After rollback, the count should be back to 0
    expect(store.getState().reactions.counts[POST_ID]?.current).toBe(0);
  });

  it('primary reaction exclusivity — setting PAST clears previous CURRENT', async () => {
    const store = makeStore();

    // Pre-set CURRENT as active
    store.dispatch({
      type: 'reactions/reactionCountsLoaded',
      payload: {
        postId:       POST_ID,
        counts:       { ...ZERO_COUNTS, current: 1 },
        userReactions: [PRIMARY_REACTION_IDS.CURRENT],
      },
    });

    mockApi.setReaction.mockResolvedValue(
      makeSetResponse(PRIMARY_REACTION_IDS.PAST, [], { ...ZERO_COUNTS, past: 1 }) as any
    );

    await store.dispatch(setReactionThunk({
      postId: POST_ID,
      primaryReaction: PRIMARY_REACTION_IDS.PAST,
    }));

    const reactions = store.getState().reactions.userReactions[POST_ID] ?? [];
    expect(reactions).toContain(PRIMARY_REACTION_IDS.PAST);
    expect(reactions).not.toContain(PRIMARY_REACTION_IDS.CURRENT);
  });

  it('secondary reactions are additive — can hold multiple', async () => {
    mockApi.setReaction.mockResolvedValue(
      makeSetResponse(null, ['same', 'i-understand'], { ...ZERO_COUNTS, same: 1, iUnderstand: 1 }) as any
    );

    const store = makeStore();
    await store.dispatch(setReactionThunk({
      postId: POST_ID,
      secondaryReactions: [SECONDARY_REACTION_IDS.SAME, SECONDARY_REACTION_IDS.I_UNDERSTAND],
    }));

    const reactions = store.getState().reactions.userReactions[POST_ID] ?? [];
    expect(reactions).toContain(SECONDARY_REACTION_IDS.SAME);
    expect(reactions).toContain(SECONDARY_REACTION_IDS.I_UNDERSTAND);
  });
});

// ─── removeReactionThunk ─────────────────────────────────────────────────────

describe('removeReactionThunk', () => {
  it('clears all reactions for the post', async () => {
    mockApi.removeReaction.mockResolvedValue({ counts: ZERO_COUNTS } as any);

    const store = makeStore();

    store.dispatch({
      type: 'reactions/reactionCountsLoaded',
      payload: {
        postId:       POST_ID,
        counts:       { ...ZERO_COUNTS, current: 1 },
        userReactions: [PRIMARY_REACTION_IDS.CURRENT],
      },
    });

    await store.dispatch(removeReactionThunk(POST_ID));

    expect(store.getState().reactions.userReactions[POST_ID]).toHaveLength(0);
    expect(store.getState().reactions.counts[POST_ID]?.current).toBe(0);
  });

  it('rolls back on failure', async () => {
    mockApi.removeReaction.mockRejectedValue(new Error('Network error'));

    const store = makeStore();
    store.dispatch({
      type: 'reactions/reactionCountsLoaded',
      payload: {
        postId:       POST_ID,
        counts:       { ...ZERO_COUNTS, current: 1 },
        userReactions: [PRIMARY_REACTION_IDS.CURRENT],
      },
    });

    await store.dispatch(removeReactionThunk(POST_ID));

    // After rollback, reaction is restored
    expect(store.getState().reactions.counts[POST_ID]?.current).toBe(1);
  });
});

// ─── fetchReactionForPostThunk ────────────────────────────────────────────────

describe('fetchReactionForPostThunk', () => {
  it('loads counts and own reaction into state', async () => {
    mockApi.getReactions.mockResolvedValue({
      counts:    { ...ZERO_COUNTS, same: 12 },
      myReaction: { postId: POST_ID, primaryReaction: null, secondaryReactions: ['same'] as any },
    } as any);

    const store = makeStore();
    await store.dispatch(fetchReactionForPostThunk(POST_ID));

    expect(store.getState().reactions.counts[POST_ID]?.same).toBe(12);
    expect(store.getState().reactions.userReactions[POST_ID]).toContain(SECONDARY_REACTION_IDS.SAME);
  });

  it('loads counts with null myReaction when not authenticated', async () => {
    mockApi.getReactions.mockResolvedValue({
      counts:    { ...ZERO_COUNTS, same: 5 },
      myReaction: null,
    } as any);

    const store = makeStore();
    await store.dispatch(fetchReactionForPostThunk(POST_ID));

    expect(store.getState().reactions.counts[POST_ID]?.same).toBe(5);
    expect(store.getState().reactions.userReactions[POST_ID]).toHaveLength(0);
  });
});

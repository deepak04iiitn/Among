import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  reactionCountsLoaded,
  reactionAddedOptimistic,
  reactionRemovedOptimistic,
  reactionConfirmed,
  reactionRolledBack,
  selectReactionCounts,
  selectUserReactions,
  selectHasReacted,
  selectPendingReaction,
} from './reactionsSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe('reactionsSlice — initial state', () => {
  it('has no counts', () => {
    const store = makeStore();
    expect(selectReactionCounts('p1')(store.getState())).toEqual({});
  });

  it('has no user reactions', () => {
    const store = makeStore();
    expect(selectUserReactions('p1')(store.getState())).toEqual([]);
  });

  it('has no pending reaction', () => {
    const store = makeStore();
    expect(selectPendingReaction(store.getState())).toBeNull();
  });
});

// ─── reactionCountsLoaded ─────────────────────────────────────────────────────

describe('reactionCountsLoaded', () => {
  it('stores counts for a post', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({
      postId: 'p1',
      counts: { same: 10, understand: 5 },
      userReactions: ['same'],
    }));
    expect(selectReactionCounts('p1')(store.getState())).toEqual({ same: 10, understand: 5 });
    expect(selectUserReactions('p1')(store.getState())).toEqual(['same']);
  });

  it('selectHasReacted returns true when user has reacted', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: ['same'] }));
    expect(selectHasReacted('p1', 'same')(store.getState())).toBe(true);
  });

  it('selectHasReacted returns false when user has not reacted', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: [] }));
    expect(selectHasReacted('p1', 'same')(store.getState())).toBe(false);
  });
});

// ─── reactionAddedOptimistic ──────────────────────────────────────────────────

describe('reactionAddedOptimistic', () => {
  it('increments count and adds to userReactions', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: [] }));
    store.dispatch(reactionAddedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(6);
    expect(selectUserReactions('p1')(store.getState())).toContain('same');
    expect(selectPendingReaction(store.getState())).toEqual({
      postId: 'p1', reactionTypeId: 'same', action: 'add',
    });
  });

  it('creates entry from 0 if no prior count', () => {
    const store = makeStore();
    store.dispatch(reactionAddedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(1);
  });
});

// ─── reactionRemovedOptimistic ────────────────────────────────────────────────

describe('reactionRemovedOptimistic', () => {
  it('decrements count and removes from userReactions', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: ['same'] }));
    store.dispatch(reactionRemovedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(4);
    expect(selectUserReactions('p1')(store.getState())).not.toContain('same');
    expect(selectPendingReaction(store.getState())).toEqual({
      postId: 'p1', reactionTypeId: 'same', action: 'remove',
    });
  });

  it('does not go below 0', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 0 }, userReactions: ['same'] }));
    store.dispatch(reactionRemovedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(0);
  });
});

// ─── reactionConfirmed ────────────────────────────────────────────────────────

describe('reactionConfirmed', () => {
  it('clears pending reaction', () => {
    const store = makeStore();
    store.dispatch(reactionAddedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    store.dispatch(reactionConfirmed());
    expect(selectPendingReaction(store.getState())).toBeNull();
  });
});

// ─── reactionRolledBack ───────────────────────────────────────────────────────

describe('reactionRolledBack', () => {
  it('rolls back an add: decrements count and removes from userReactions', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: [] }));
    store.dispatch(reactionAddedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    // count is now 6
    store.dispatch(reactionRolledBack({ postId: 'p1', reactionTypeId: 'same', action: 'add' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(5);
    expect(selectUserReactions('p1')(store.getState())).not.toContain('same');
    expect(selectPendingReaction(store.getState())).toBeNull();
  });

  it('rolls back a remove: increments count and adds back to userReactions', () => {
    const store = makeStore();
    store.dispatch(reactionCountsLoaded({ postId: 'p1', counts: { same: 5 }, userReactions: ['same'] }));
    store.dispatch(reactionRemovedOptimistic({ postId: 'p1', reactionTypeId: 'same' }));
    // count is now 4
    store.dispatch(reactionRolledBack({ postId: 'p1', reactionTypeId: 'same', action: 'remove' }));
    expect(selectReactionCounts('p1')(store.getState())['same']).toBe(5);
    expect(selectUserReactions('p1')(store.getState())).toContain('same');
    expect(selectPendingReaction(store.getState())).toBeNull();
  });
});

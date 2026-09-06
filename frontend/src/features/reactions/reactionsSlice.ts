import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReactionCounts {
  /** Counts keyed by reaction type ID (e.g. 'same', 'understand', 'tell_me_more') */
  readonly [reactionTypeId: string]: number;
}

/** A pending reaction waiting for server acknowledgement */
export interface PendingReaction {
  readonly postId: string;
  readonly reactionTypeId: string;
  readonly action: 'add' | 'remove';
}

export interface ReactionsState {
  /** Reaction counts per post — keyed by post ID */
  counts: Record<string, ReactionCounts>;
  /** Reaction type IDs the current user has applied — keyed by post ID */
  userReactions: Record<string, string[]>;
  /** Currently in-flight reaction (for optimistic UI) */
  pending: PendingReaction | null;
  error: string | null;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: ReactionsState = {
  counts: {},
  userReactions: {},
  pending: null,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    /** Load initial reaction counts for a post from the API response */
    reactionCountsLoaded(
      state,
      action: PayloadAction<{ postId: string; counts: ReactionCounts; userReactions: string[] }>
    ) {
      const { postId, counts, userReactions } = action.payload;
      state.counts[postId] = counts;
      state.userReactions[postId] = userReactions;
    },

    /** Optimistic add — update counts before server confirms */
    reactionAddedOptimistic(
      state,
      action: PayloadAction<{ postId: string; reactionTypeId: string }>
    ) {
      const { postId, reactionTypeId } = action.payload;
      const current = state.counts[postId] ?? {};
      state.counts[postId] = {
        ...current,
        [reactionTypeId]: (current[reactionTypeId] ?? 0) + 1,
      };
      state.userReactions[postId] = [
        ...(state.userReactions[postId] ?? []),
        reactionTypeId,
      ];
      state.pending = { postId, reactionTypeId, action: 'add' };
    },

    /** Optimistic remove */
    reactionRemovedOptimistic(
      state,
      action: PayloadAction<{ postId: string; reactionTypeId: string }>
    ) {
      const { postId, reactionTypeId } = action.payload;
      const current = state.counts[postId] ?? {};
      state.counts[postId] = {
        ...current,
        [reactionTypeId]: Math.max(0, (current[reactionTypeId] ?? 1) - 1),
      };
      state.userReactions[postId] = (state.userReactions[postId] ?? []).filter(
        (id) => id !== reactionTypeId
      );
      state.pending = { postId, reactionTypeId, action: 'remove' };
    },

    /** Server confirmed the reaction — clear pending */
    reactionConfirmed(state) {
      state.pending = null;
      state.error = null;
    },

    /** Server rejected the reaction — roll back optimistic update */
    reactionRolledBack(
      state,
      action: PayloadAction<{ postId: string; reactionTypeId: string; action: 'add' | 'remove' }>
    ) {
      const { postId, reactionTypeId, action: reactionAction } = action.payload;
      const current = state.counts[postId] ?? {};
      if (reactionAction === 'add') {
        // Undo the add
        state.counts[postId] = {
          ...current,
          [reactionTypeId]: Math.max(0, (current[reactionTypeId] ?? 1) - 1),
        };
        state.userReactions[postId] = (state.userReactions[postId] ?? []).filter(
          (id) => id !== reactionTypeId
        );
      } else {
        // Undo the remove
        state.counts[postId] = {
          ...current,
          [reactionTypeId]: (current[reactionTypeId] ?? 0) + 1,
        };
        state.userReactions[postId] = [
          ...(state.userReactions[postId] ?? []),
          reactionTypeId,
        ];
      }
      state.pending = null;
      state.error = action.payload.reactionTypeId + ' reaction failed';
    },
  },
});

export const {
  reactionCountsLoaded,
  reactionAddedOptimistic,
  reactionRemovedOptimistic,
  reactionConfirmed,
  reactionRolledBack,
} = reactionsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectReactionCounts = (postId: string) =>
  (state: RootState): ReactionCounts => state.reactions.counts[postId] ?? {};

export const selectUserReactions = (postId: string) =>
  (state: RootState): string[] => state.reactions.userReactions[postId] ?? [];

export const selectHasReacted = (postId: string, reactionTypeId: string) =>
  (state: RootState): boolean =>
    (state.reactions.userReactions[postId] ?? []).includes(reactionTypeId);

export const selectPendingReaction = (state: RootState): PendingReaction | null =>
  state.reactions.pending;

export default reactionsSlice.reducer;

/**
 * reactionsThunks.ts — Redux thunks for the reaction system.
 *
 * Optimistic update pattern:
 *  1. Apply optimistic update to local state immediately (user sees instant feedback).
 *  2. Fire API call.
 *  3. On success: confirm (clear pending, apply server counts).
 *  4. On failure: rollback the optimistic update.
 *
 * Primary reaction exclusivity is enforced here (UX) and on the server (authoritative):
 *  - Before setting a new primary, the old primary is cleared in the optimistic update.
 *  - This ensures the UI is consistent with the server invariant.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as reactionsApi from '../../lib/reactionsApi';
import {
  reactionCountsLoaded,
  reactionAddedOptimistic,
  reactionRemovedOptimistic,
  reactionConfirmed,
  reactionRolledBack,
} from './reactionsSlice';
import type { PrimaryReactionId, SecondaryReactionId } from '../../constants/reactionTypes';
import { PRIMARY_REACTION_IDS, SECONDARY_REACTION_IDS } from '../../constants/reactionTypes';
import type { AppDispatch, RootState } from '../../store';

// ─── setReactionThunk ─────────────────────────────────────────────────────────

export interface SetReactionPayload {
  postId:              string;
  primaryReaction?:    PrimaryReactionId | null;
  secondaryReactions?: SecondaryReactionId[];
}

export const setReactionThunk = createAsyncThunk<
  void,
  SetReactionPayload,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'reactions/set',
  async (payload, { dispatch, getState, rejectWithValue }) => {
    const { postId, primaryReaction, secondaryReactions } = payload;

    // ─── Optimistic updates ───────────────────────────────────────────────
    const currentState   = getState().reactions;
    const currentCounts  = currentState.counts[postId] ?? {};
    const currentReacted = currentState.userReactions[postId] ?? [];

    // Handle primary reaction (exclusive)
    if (primaryReaction !== undefined) {
      // Clear the previous primary reaction optimistically
      const prevPrimary = Object.values(PRIMARY_REACTION_IDS).find(
        (id) => currentReacted.includes(id)
      );
      if (prevPrimary && prevPrimary !== primaryReaction) {
        dispatch(reactionRemovedOptimistic({ postId, reactionTypeId: prevPrimary }));
      }

      if (primaryReaction !== null && primaryReaction !== prevPrimary) {
        dispatch(reactionAddedOptimistic({ postId, reactionTypeId: primaryReaction }));
      } else if (primaryReaction === null && prevPrimary) {
        dispatch(reactionRemovedOptimistic({ postId, reactionTypeId: prevPrimary }));
      }
    }

    // Handle secondary reactions
    if (secondaryReactions !== undefined) {
      const prevSecondary = currentReacted.filter(
        (id) => Object.values(SECONDARY_REACTION_IDS).includes(id as SecondaryReactionId)
      );
      const toAdd    = secondaryReactions.filter((id) => !prevSecondary.includes(id));
      const toRemove = prevSecondary.filter((id) => !secondaryReactions.includes(id as SecondaryReactionId));

      toAdd.forEach((id)    => dispatch(reactionAddedOptimistic({ postId, reactionTypeId: id })));
      toRemove.forEach((id) => dispatch(reactionRemovedOptimistic({ postId, reactionTypeId: id })));
    }

    // ─── API call ────────────────────────────────────────────────────────
    try {
      const result = await reactionsApi.setReaction(postId, {
        primaryReaction,
        secondaryReactions,
      });

      // Confirm with server-authoritative counts
      dispatch(reactionCountsLoaded({
        postId,
        counts:        result.counts as ReturnType<typeof reactionCountsLoaded>['payload']['counts'],
        userReactions: [
          ...(result.myReaction.primaryReaction ? [result.myReaction.primaryReaction] : []),
          ...result.myReaction.secondaryReactions,
        ],
      }));
      dispatch(reactionConfirmed());
    } catch {
      // Rollback all optimistic updates using the pre-update state
      dispatch(reactionCountsLoaded({
        postId,
        counts:        currentCounts as ReturnType<typeof reactionCountsLoaded>['payload']['counts'],
        userReactions: currentReacted,
      }));
      dispatch(reactionRolledBack({
        postId,
        reactionTypeId: primaryReaction ?? secondaryReactions?.[0] ?? '',
        action:         'add',
      }));
      return rejectWithValue('Failed to save reaction. Please try again.');
    }
  }
);

// ─── removeReactionThunk ─────────────────────────────────────────────────────

export const removeReactionThunk = createAsyncThunk<
  void,
  string, // postId
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'reactions/remove',
  async (postId, { dispatch, getState, rejectWithValue }) => {
    const currentState   = getState().reactions;
    const currentCounts  = currentState.counts[postId] ?? {};
    const currentReacted = currentState.userReactions[postId] ?? [];

    // Optimistically clear all reactions for this post
    currentReacted.forEach((reactionTypeId) => {
      dispatch(reactionRemovedOptimistic({ postId, reactionTypeId }));
    });

    try {
      const result = await reactionsApi.removeReaction(postId);
      dispatch(reactionCountsLoaded({
        postId,
        counts:        result.counts as ReturnType<typeof reactionCountsLoaded>['payload']['counts'],
        userReactions: [],
      }));
      dispatch(reactionConfirmed());
    } catch {
      // Rollback — restore previous state entirely using authoritative snapshot
      dispatch(reactionCountsLoaded({
        postId,
        counts:        currentCounts as ReturnType<typeof reactionCountsLoaded>['payload']['counts'],
        userReactions: currentReacted,
      }));
      // Clear pending without an additional count adjustment (counts already restored above)
      dispatch(reactionConfirmed());
      return rejectWithValue('Failed to remove reaction. Please try again.');
    }
  }
);

// ─── fetchReactionForPostThunk ────────────────────────────────────────────────

export const fetchReactionForPostThunk = createAsyncThunk<
  void,
  string, // postId
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'reactions/fetchForPost',
  async (postId, { dispatch, rejectWithValue }) => {
    try {
      const result = await reactionsApi.getReactions(postId);
      dispatch(reactionCountsLoaded({
        postId,
        counts:        result.counts as ReturnType<typeof reactionCountsLoaded>['payload']['counts'],
        userReactions: result.myReaction
          ? [
              ...(result.myReaction.primaryReaction ? [result.myReaction.primaryReaction] : []),
              ...result.myReaction.secondaryReactions,
            ]
          : [],
      }));
    } catch {
      return rejectWithValue('Failed to load reactions.');
    }
  }
);

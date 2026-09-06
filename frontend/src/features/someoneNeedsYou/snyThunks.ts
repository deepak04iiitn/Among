/**
 * snyThunks.ts — Async Redux thunks for the SNY feature.
 */
import type { AppDispatch } from '../../store';
import * as snyApi from '../../lib/snyApi';
import {
  snyLoading,
  promptLoaded,
  promptStatusLoaded,
  promptSkipped,
  promptAccepted,
  promptDismissed,
  historyLoaded,
  optInUpdated,
  snyError,
} from './snySlice';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export function fetchDailyPromptThunk() {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(snyLoading());
    try {
      const prompt = await snyApi.getDailyPrompt();
      dispatch(promptLoaded(prompt));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load prompt';
      dispatch(snyError(msg));
    }
  };
}

export function fetchPromptStatusThunk() {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      const status = await snyApi.getPromptStatus();
      dispatch(promptStatusLoaded(status));
    } catch {
      // Non-critical — don't error on status fetch failure
    }
  };
}

export function skipPromptThunk(skippedPostId: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(snyLoading());
    try {
      const nextPrompt = await snyApi.skipPrompt(skippedPostId);
      dispatch(promptSkipped(nextPrompt));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to skip prompt';
      dispatch(snyError(msg));
    }
  };
}

export function acceptPromptThunk(promptPostId: string) {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(snyLoading());
    try {
      const result = await snyApi.acceptPrompt(promptPostId);
      dispatch(promptAccepted(result));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept prompt';
      dispatch(snyError(msg));
    }
  };
}

export function dismissPromptThunk() {
  return async (dispatch: AppDispatch): Promise<void> => {
    try {
      await snyApi.dismissPrompt();
      dispatch(promptDismissed());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dismiss prompt';
      dispatch(snyError(msg));
    }
  };
}

export function fetchExperienceHistoryThunk() {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(snyLoading());
    try {
      const history = await snyApi.getExperienceHistory();
      dispatch(historyLoaded(history));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load experience history';
      dispatch(snyError(msg));
    }
  };
}

export function updateOptInThunk(categoryId: string, optIn: boolean) {
  return async (dispatch: AppDispatch): Promise<void> => {
    // Optimistic update
    dispatch(optInUpdated({ categoryId, optIn }));
    try {
      await snyApi.updateOptIn(categoryId, optIn);
    } catch (err: unknown) {
      // Revert on failure
      dispatch(optInUpdated({ categoryId, optIn: !optIn }));
      const msg = err instanceof Error ? err.message : 'Failed to update opt-in';
      dispatch(snyError(msg));
    }
  };
}

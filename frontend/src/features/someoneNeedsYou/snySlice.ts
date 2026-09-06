/**
 * snySlice.ts — Redux state for "Someone Needs You" feature.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { SNYPrompt, ExperienceHistoryEntry, SNYPromptStatus } from '../../lib/snyApi';

// ─── State ────────────────────────────────────────────────────────────────────

export interface SNYState {
  /** Today's prompt — null if none available or dismissed */
  prompt:            SNYPrompt | null;
  promptStatus:      SNYPromptStatus | null;
  experienceHistory: ExperienceHistoryEntry[];
  /** Conversation context to pass after accepting a prompt */
  acceptedContext:   { contextCategoryId: string; contextPostId: string } | null;
  status:            'idle' | 'loading' | 'success' | 'error';
  error:             string | null;
}

const initialState: SNYState = {
  prompt:            null,
  promptStatus:      null,
  experienceHistory: [],
  acceptedContext:   null,
  status:            'idle',
  error:             null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const snySlice = createSlice({
  name: 'sny',
  initialState,
  reducers: {
    snyLoading(state) {
      state.status = 'loading';
      state.error  = null;
    },

    promptLoaded(state, action: PayloadAction<SNYPrompt | null>) {
      state.status = 'success';
      state.prompt = action.payload;
    },

    promptStatusLoaded(state, action: PayloadAction<SNYPromptStatus>) {
      state.promptStatus = action.payload;
    },

    promptSkipped(state, action: PayloadAction<SNYPrompt | null>) {
      state.status = 'success';
      state.prompt = action.payload;
      if (state.promptStatus) {
        state.promptStatus = {
          ...state.promptStatus,
          skipsUsed: (state.promptStatus.skipsUsed ?? 0) + 1,
        };
      }
    },

    promptAccepted(
      state,
      action: PayloadAction<{ contextCategoryId: string; contextPostId: string }>
    ) {
      state.status         = 'success';
      state.prompt         = null;
      state.acceptedContext = action.payload;
    },

    promptDismissed(state) {
      state.status = 'success';
      state.prompt = null;
      if (state.promptStatus) {
        state.promptStatus = { ...state.promptStatus, dismissed: true };
      }
    },

    historyLoaded(state, action: PayloadAction<ExperienceHistoryEntry[]>) {
      state.status           = 'success';
      state.experienceHistory = action.payload;
    },

    optInUpdated(state, action: PayloadAction<{ categoryId: string; optIn: boolean }>) {
      const { categoryId, optIn } = action.payload;
      state.experienceHistory = state.experienceHistory.map((e) =>
        e.categoryId === categoryId ? { ...e, snyOptIn: optIn } : e
      );
    },

    snyError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error  = action.payload;
    },

    acceptedContextCleared(state) {
      state.acceptedContext = null;
    },
  },
});

export const {
  snyLoading,
  promptLoaded,
  promptStatusLoaded,
  promptSkipped,
  promptAccepted,
  promptDismissed,
  historyLoaded,
  optInUpdated,
  snyError,
  acceptedContextCleared,
} = snySlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSNYPrompt           = (state: RootState): SNYPrompt | null        => state.sny.prompt;
export const selectSNYStatus           = (state: RootState): SNYState['status']       => state.sny.status;
export const selectSNYError            = (state: RootState): string | null            => state.sny.error;
export const selectPromptStatus        = (state: RootState): SNYPromptStatus | null   => state.sny.promptStatus;
export const selectExperienceHistory   = (state: RootState): ExperienceHistoryEntry[] => state.sny.experienceHistory;
export const selectAcceptedContext     = (state: RootState)                           => state.sny.acceptedContext;

export default snySlice.reducer;

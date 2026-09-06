/**
 * moderationSlice.ts — Redux state for reports and blocks.
 *
 * Privacy: no reporter identity, no report outcome stored in state.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BlockedAccountEntry } from '../../lib/moderationApi';
import type { RootState } from '../../store';

// ─── State ────────────────────────────────────────────────────────────────────

export interface ModerationState {
  /** Whether the report modal is open */
  reportModalOpen:   boolean;
  /** Content being reported (id + type + optional context) */
  reportTarget: {
    contentId:   string;
    contentType: 'post' | 'message' | 'response';
  } | null;
  /** true once the report was submitted — shows confirmation state */
  reportSubmitted:   boolean;

  /** true while a report is being submitted */
  reportLoading:     boolean;

  /** User's current block list */
  blockList:         BlockedAccountEntry[];
  blockListStatus:   'idle' | 'loading' | 'success' | 'error';

  /** Pending block confirmation (accountId being confirmed) */
  blockConfirmTarget: string | null;

  error: string | null;
}

const initialState: ModerationState = {
  reportModalOpen:    false,
  reportTarget:       null,
  reportSubmitted:    false,
  reportLoading:      false,
  blockList:          [],
  blockListStatus:    'idle',
  blockConfirmTarget: null,
  error:              null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const moderationSlice = createSlice({
  name: 'moderation',
  initialState,
  reducers: {
    openReportModal(
      state,
      action: PayloadAction<{ contentId: string; contentType: 'post' | 'message' | 'response' }>
    ) {
      state.reportModalOpen = true;
      state.reportTarget    = action.payload;
      state.reportSubmitted = false;
      state.error           = null;
    },
    closeReportModal(state) {
      state.reportModalOpen = false;
      state.reportTarget    = null;
      state.reportSubmitted = false;
      state.error           = null;
    },
    reportLoading(state) {
      state.reportLoading = true;
      state.error         = null;
    },
    reportSubmitted(state) {
      state.reportLoading  = false;
      state.reportSubmitted = true;
    },
    reportError(state, action: PayloadAction<string>) {
      state.reportLoading = false;
      state.error         = action.payload;
    },

    blockListLoading(state) {
      state.blockListStatus = 'loading';
    },
    blockListLoaded(state, action: PayloadAction<BlockedAccountEntry[]>) {
      state.blockListStatus = 'success';
      state.blockList       = action.payload;
    },
    blockListError(state, action: PayloadAction<string>) {
      state.blockListStatus = 'error';
      state.error           = action.payload;
    },

    openBlockConfirm(state, action: PayloadAction<string>) {
      state.blockConfirmTarget = action.payload;
    },
    closeBlockConfirm(state) {
      state.blockConfirmTarget = null;
    },
    blockSucceeded(state, action: PayloadAction<string>) {
      state.blockConfirmTarget = null;
      // Remove from block list if it somehow got there; real list refresh via thunk
      state.blockList = state.blockList.filter(
        (b) => b.blockedAccountId !== action.payload
      );
    },
    unblockSucceeded(state, action: PayloadAction<string>) {
      state.blockList = state.blockList.filter(
        (b) => b.blockedAccountId !== action.payload
      );
    },
  },
});

export const {
  openReportModal,
  closeReportModal,
  reportLoading,
  reportSubmitted,
  reportError,
  blockListLoading,
  blockListLoaded,
  blockListError,
  openBlockConfirm,
  closeBlockConfirm,
  blockSucceeded,
  unblockSucceeded,
} = moderationSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectReportModalOpen    = (s: RootState) => s.moderation.reportModalOpen;
export const selectReportTarget       = (s: RootState) => s.moderation.reportTarget;
export const selectReportSubmitted    = (s: RootState) => s.moderation.reportSubmitted;
export const selectReportLoading      = (s: RootState) => s.moderation.reportLoading;
export const selectBlockList          = (s: RootState) => s.moderation.blockList;
export const selectBlockListStatus    = (s: RootState) => s.moderation.blockListStatus;
export const selectBlockConfirmTarget = (s: RootState) => s.moderation.blockConfirmTarget;
export const selectModerationError    = (s: RootState) => s.moderation.error;

export default moderationSlice.reducer;

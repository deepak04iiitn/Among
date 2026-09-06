/**
 * moderationThunks.ts — Async logic for report and block operations.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../lib/moderationApi';
import {
  reportLoading,
  reportSubmitted,
  reportError,
  blockListLoading,
  blockListLoaded,
  blockListError,
  blockSucceeded,
  unblockSucceeded,
} from './moderationSlice';
import type { AppDispatch } from '../../store';
import type { SubmitReportPayload } from '../../lib/moderationApi';

// ─── Submit report ────────────────────────────────────────────────────────────

export function submitReportThunk(payload: SubmitReportPayload) {
  return async (dispatch: AppDispatch) => {
    dispatch(reportLoading());
    try {
      await api.submitReport(payload);
      // Always show confirmation — never reveal outcome (PRD §6.6)
      dispatch(reportSubmitted());
    } catch {
      dispatch(reportError('Unable to submit report. Please try again.'));
    }
  };
}

// ─── Block list ───────────────────────────────────────────────────────────────

export const fetchBlockListThunk = createAsyncThunk(
  'moderation/fetchBlockList',
  async (_, { dispatch }) => {
    dispatch(blockListLoading());
    try {
      const blocks = await api.getBlockList();
      dispatch(blockListLoaded(blocks));
    } catch {
      dispatch(blockListError('Unable to load block list.'));
    }
  }
);

// ─── Block user ───────────────────────────────────────────────────────────────

export function blockUserThunk(blockedAccountId: string) {
  return async (dispatch: AppDispatch) => {
    try {
      await api.blockUser(blockedAccountId);
      dispatch(blockSucceeded(blockedAccountId));
    } catch {
      dispatch(blockListError('Unable to block user. Please try again.'));
    }
  };
}

// ─── Unblock user ─────────────────────────────────────────────────────────────

export function unblockUserThunk(blockedAccountId: string) {
  return async (dispatch: AppDispatch) => {
    try {
      await api.unblockUser(blockedAccountId);
      dispatch(unblockSucceeded(blockedAccountId));
    } catch {
      dispatch(blockListError('Unable to unblock user. Please try again.'));
    }
  };
}

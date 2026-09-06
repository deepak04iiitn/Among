/**
 * moderationApi.ts — HTTP client for report and block endpoints.
 *
 * Privacy invariants:
 *  - submitReport always returns { success: true } regardless of outcome.
 *  - Report outcomes never communicated back to the reporter.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';
import type { ReportReason } from '../constants/reportReasons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportContentType = 'post' | 'message' | 'response';

export interface SubmitReportPayload {
  contentType:        ReportContentType;
  contentId:          string;
  reason:             ReportReason;
  additionalDetails?: string;
}

export interface BlockedAccountEntry {
  blockedAccountId: string;
  createdAt:        string;
}

// ─── Report API ───────────────────────────────────────────────────────────────

export async function submitReport(
  payload: SubmitReportPayload
): Promise<{ success: true }> {
  const res = await apiClient.post<{ success: true }>(API.REPORTS, payload);
  return res.data;
}

// ─── Block API ────────────────────────────────────────────────────────────────

export async function blockUser(
  blockedAccountId: string
): Promise<{ success: true }> {
  const res = await apiClient.post<{ success: true }>(API.USERS_ME_BLOCKS, {
    blockedAccountId,
  });
  return res.data;
}

export async function unblockUser(
  blockedAccountId: string
): Promise<{ success: true }> {
  const res = await apiClient.delete<{ success: true }>(
    API.USERS_ME_BLOCK(blockedAccountId)
  );
  return res.data;
}

export async function getBlockList(): Promise<BlockedAccountEntry[]> {
  const res = await apiClient.get<{ blocks: BlockedAccountEntry[] }>(API.USERS_ME_BLOCKS);
  return res.data.blocks;
}

/**
 * snyApi.ts — HTTP client for "Someone Needs You" endpoints.
 */
import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SNYPrompt {
  postId:         string;
  categoryId:     string;
  bodyPreview:    string;
  skipsUsed:      number;
  skipsRemaining: number;
}

export interface ExperienceHistoryEntry {
  categoryId:        string;
  hasPostedAbout:    boolean;
  pastReactionCount: number;
  conversationCount: number;
  snyOptIn:          boolean;
  lastUpdatedAt:     string;
}

export interface SNYPromptStatus {
  dismissed:   boolean;
  promptsSent: number;
  skipsUsed:   number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getDailyPrompt(): Promise<SNYPrompt | null> {
  const res = await apiClient.get<{ prompt: SNYPrompt | null }>('/sny/prompt');
  return res.data.prompt;
}

export async function skipPrompt(skippedPostId: string): Promise<SNYPrompt | null> {
  const res = await apiClient.post<{ prompt: SNYPrompt | null }>('/sny/skip', { skippedPostId });
  return res.data.prompt;
}

export async function acceptPrompt(promptPostId: string): Promise<{
  contextCategoryId: string;
  contextPostId:     string;
}> {
  const res = await apiClient.post<{ contextCategoryId: string; contextPostId: string }>(
    '/sny/accept',
    { promptPostId }
  );
  return res.data;
}

export async function dismissPrompt(): Promise<void> {
  await apiClient.post('/sny/dismiss', {});
}

export async function getPromptStatus(): Promise<SNYPromptStatus> {
  const res = await apiClient.get<SNYPromptStatus>('/sny/status');
  return res.data;
}

export async function getExperienceHistory(): Promise<ExperienceHistoryEntry[]> {
  const res = await apiClient.get<{ experiences: ExperienceHistoryEntry[] }>('/sny/history');
  return res.data.experiences;
}

export async function updateOptIn(categoryId: string, optIn: boolean): Promise<void> {
  await apiClient.patch('/sny/opt-in', { categoryId, optIn });
}

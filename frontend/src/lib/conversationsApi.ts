/**
 * conversationsApi.ts — Frontend HTTP client for conversation endpoints.
 *
 * Privacy contract: senderAccountId and participantAccountIds are NEVER
 * present in any response payload — only alias snapshots are used.
 */
import apiClient from './apiClient';
import { API } from '../constants/apiEndpoints';

// ─── API types ────────────────────────────────────────────────────────────────

export interface AliasSnapshot {
  aliasName:  string;
  avatarSeed: string;
}

export interface ConversationListItem {
  id:                 string;
  contextCategoryId:  string;
  state:              string;
  otherAliasSnapshot: AliasSnapshot | null;
  startedAt:          string | null;
  endedAt:            string | null;
  lastActivityAt:     string | null;
}

export interface ConversationDetail {
  id:                 string;
  contextCategoryId:  string;
  contextPostId:      string | null;
  state:              string;
  myAliasSnapshot:    AliasSnapshot;
  otherAliasSnapshot: AliasSnapshot | null;
  requestedAt:        string;
  matchedAt:          string | null;
  startedAt:          string | null;
  expiresAt:          string | null;
  endedAt:            string | null;
  endReason:          string | null;
  feedbackSubmitted:  boolean;
  transcriptVisible:  boolean;
}

export interface PublicMessage {
  id:                  string;
  senderAliasSnapshot: string;   // alias name only
  senderAvatarSeed:    string;
  body:                string;
  contactInfoWarning:  boolean;
  sentAt:              string;
  isDeleted:           boolean;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function createMatchRequest(params: {
  contextCategoryId: string;
  contextPostId?:    string;
}): Promise<{ matched: boolean; conversationId: string; state: string }> {
  const { data } = await apiClient.post(API.CONVERSATION_REQUEST, params);
  return data as { matched: boolean; conversationId: string; state: string };
}

export async function cancelMatchRequest(conversationId: string): Promise<void> {
  await apiClient.delete(API.CONVERSATION_CANCEL(conversationId));
}

export async function listConversations(): Promise<ConversationListItem[]> {
  const { data } = await apiClient.get(API.CONVERSATIONS);
  return (data as { conversations: ConversationListItem[] }).conversations;
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const { data } = await apiClient.get(API.CONVERSATION(conversationId));
  return (data as { conversation: ConversationDetail }).conversation;
}

export async function endConversation(conversationId: string): Promise<void> {
  await apiClient.post(API.CONVERSATION_END(conversationId));
}

export async function submitFeedback(conversationId: string, helpful: boolean): Promise<void> {
  await apiClient.post(API.CONVERSATION_FEEDBACK(conversationId), { helpful });
}

export async function sendMessageHttp(
  conversationId: string,
  body:           string
): Promise<{ message: PublicMessage; contactInfoWarning: boolean; isNewWarning: boolean }> {
  const { data } = await apiClient.post(API.CONVERSATION_MESSAGES(conversationId), { body });
  return data as { message: PublicMessage; contactInfoWarning: boolean; isNewWarning: boolean };
}

export async function getMessages(
  conversationId: string,
  opts?: { cursor?: string; limit?: number }
): Promise<{ messages: PublicMessage[]; nextCursor: string | null }> {
  const params: Record<string, string | number> = {};
  if (opts?.cursor) params['cursor'] = opts.cursor;
  if (opts?.limit)  params['limit']  = opts.limit;
  const { data } = await apiClient.get(API.CONVERSATION_MESSAGES(conversationId), { params });
  return data as { messages: PublicMessage[]; nextCursor: string | null };
}

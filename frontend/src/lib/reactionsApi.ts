/**
 * reactionsApi.ts — Frontend API client for reaction endpoints.
 *
 * Privacy contract: no function here ever sends or accepts accountId,
 * reaction identity lists, or "who reacted" data.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';
import type { PrimaryReactionId, SecondaryReactionId } from '../constants/reactionTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiReactionCounts {
  current:     number;
  past:        number;
  considering: number;
  same:        number;
  iUnderstand: number;
  iLearned:    number;
  iDisagree:   number;
  tellMeMore:  number;
}

/** The calling user's own reaction — safe to return to the reacting user only */
export interface ApiUserReaction {
  postId:              string;
  primaryReaction:     PrimaryReactionId | null;
  secondaryReactions:  SecondaryReactionId[];
}

export interface SetReactionInput {
  primaryReaction?:    PrimaryReactionId | null;
  secondaryReactions?: SecondaryReactionId[];
}

export interface SetReactionResponse {
  counts:    ApiReactionCounts;
  myReaction: ApiUserReaction;
}

export interface GetReactionsResponse {
  counts:    ApiReactionCounts;
  myReaction: ApiUserReaction | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function setReaction(
  postId: string,
  input:  SetReactionInput
): Promise<SetReactionResponse> {
  const res = await apiClient.put<SetReactionResponse>(
    API.POST_REACTIONS(postId),
    input
  );
  return res.data;
}

export async function removeReaction(postId: string): Promise<{ counts: ApiReactionCounts }> {
  const res = await apiClient.delete<{ counts: ApiReactionCounts }>(
    API.POST_REACTIONS(postId)
  );
  return res.data;
}

export async function getReactions(postId: string): Promise<GetReactionsResponse> {
  const res = await apiClient.get<GetReactionsResponse>(API.POST_REACTIONS(postId));
  return res.data;
}

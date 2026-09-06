/**
 * discoveryApi.ts — Frontend API client for discovery endpoints.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiPost {
  id:              string;
  authorAlias:     string;
  authorAvatarSeed: string;
  body:            string;
  categoryIds:     string[];
  state:           string;
  visibilityScope: string;
  status:          string;
  publishedAt:     string;
  editableUntil:   string;
  editedAt:        string | null;
  reactionCounts: {
    current:     number;
    past:        number;
    considering: number;
    same:        number;
    iUnderstand: number;
    iLearned:    number;
    iDisagree:   number;
    tellMeMore:  number;
  };
}

export interface HomeFeedResponse {
  primary:   ApiPost | null;
  secondary: ApiPost[];
}

export interface CategoryFeedResponse {
  posts:      ApiPost[];
  nextCursor: string | null;
}

export interface SimilarPostsResponse {
  posts: ApiPost[];
}

export interface YanaStatEntry {
  categoryId:    string;
  displayName:   string;
  count:         number | null;
  belowThreshold: boolean;
}

export interface YanaStatsResponse {
  entries: YanaStatEntry[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getHomeFeed(): Promise<HomeFeedResponse> {
  const res = await apiClient.get<HomeFeedResponse>(API.DISCOVERY_FEED);
  return res.data;
}

export async function getCategoryFeed(
  slug:   string,
  cursor?: string,
  limit?:  number
): Promise<CategoryFeedResponse> {
  const params: Record<string, string | number> = {};
  if (cursor) params['cursor'] = cursor;
  if (limit)  params['limit']  = limit;

  const res = await apiClient.get<CategoryFeedResponse>(
    API.DISCOVERY_CATEGORY(slug),
    { params }
  );
  return res.data;
}

export async function getSimilarPosts(postId: string): Promise<SimilarPostsResponse> {
  const res = await apiClient.get<SimilarPostsResponse>(API.POST_SIMILAR(postId));
  return res.data;
}

export async function savePost(postId: string): Promise<void> {
  await apiClient.post(API.POST_SAVED(postId));
}

export async function unsavePost(postId: string): Promise<void> {
  await apiClient.delete(API.POST_SAVED(postId));
}

export async function getSavedPosts(cursor?: string, limit?: number): Promise<CategoryFeedResponse> {
  const params: Record<string, string | number> = {};
  if (cursor) params['cursor'] = cursor;
  if (limit)  params['limit']  = limit;

  const res = await apiClient.get<CategoryFeedResponse>(API.USERS_ME_SAVED, { params });
  return res.data;
}

export async function getYanaStats(): Promise<YanaStatsResponse> {
  const res = await apiClient.get<YanaStatsResponse>(API.USERS_ME_YOU_ARE_NOT_ALONE);
  return res.data;
}

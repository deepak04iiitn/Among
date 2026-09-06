/**
 * postsApi.ts — Frontend API client for post endpoints.
 *
 * Privacy contract: no function here ever sends or accepts authorAccountId,
 * moderationNotes, or contentFlags.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';
import type { PostExperienceState, PostVisibility } from '../constants/postStates';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ReactionCounts {
  current:     number;
  past:        number;
  considering: number;
  same:        number;
  iUnderstand: number;
  iLearned:    number;
  iDisagree:   number;
  tellMeMore:  number;
}

/** Public shape of a post returned from the API */
export interface ApiPost {
  id:              string;
  body:            string;
  categoryIds:     string[];
  state:           PostExperienceState;
  visibilityScope: PostVisibility;
  status:          string;
  authorAlias:     string;
  authorAvatarSeed: string;
  publishedAt:     string;
  editableUntil:   string;
  editedAt:        string | null;
  reactionCounts:  ReactionCounts;
  isOwnPost:       boolean;
}

export interface CrisisResource {
  type:       string;
  name:       string;
  phone?:     string;
  text?:      string;
  chat?:      string;
  url?:       string;
  hours?:     string;
  description: string;
}

export interface CreatePostResponse {
  post:            ApiPost;
  crisisDetected:  boolean;
  crisisResources: CrisisResource[] | null;
  safetyWarnings:  string[];
}

export interface DeletedPostResponse {
  status:             string;
  redirectCategoryId: string | null;
}

export interface PaginatedPostsResponse {
  posts:      ApiPost[];
  nextCursor: string | null;
}

// ─── Create post ─────────────────────────────────────────────────────────────

export interface CreatePostInput {
  body:            string;
  categoryIds:     string[];
  state:           PostExperienceState;
  visibilityScope: PostVisibility;
}

export async function createPost(input: CreatePostInput): Promise<CreatePostResponse> {
  const res = await apiClient.post<CreatePostResponse>(API.POSTS, input);
  return res.data;
}

// ─── Get post by ID ───────────────────────────────────────────────────────────

export async function getPost(id: string): Promise<ApiPost | DeletedPostResponse> {
  const res = await apiClient.get<ApiPost | DeletedPostResponse>(API.POST(id));
  return res.data;
}

// ─── Edit post ────────────────────────────────────────────────────────────────

export async function editPost(id: string, body: string): Promise<ApiPost> {
  const res = await apiClient.put<ApiPost>(API.POST(id), { body });
  return res.data;
}

// ─── Delete post ─────────────────────────────────────────────────────────────

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(API.POST(id));
}

// ─── Get author's own posts ───────────────────────────────────────────────────

export async function getMyPosts(cursor?: string, limit?: number): Promise<PaginatedPostsResponse> {
  const params: Record<string, string> = {};
  if (cursor)         params['cursor'] = cursor;
  if (limit !== undefined) params['limit'] = String(limit);

  const res = await apiClient.get<PaginatedPostsResponse>(API.POSTS_MY, { params });
  return res.data;
}

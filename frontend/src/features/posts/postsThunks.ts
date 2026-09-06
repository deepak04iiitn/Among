/**
 * postsThunks.ts — Redux thunks for post CRUD operations.
 *
 * Crisis handling: when `createPostThunk` receives `crisisDetected: true` in
 * the API response, it dispatches `showCrisisBanner` to surface resources.
 * This is unconditional and immediate — never delayed or suppressed (PRD §6.4).
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as postsApi from '../../lib/postsApi';
import {
  composeSubmitting,
  composeSuccess,
  composeErrorAction,
  postAdded,
  postUpdated,
  postRemoved,
  myPostsLoaded,
} from './postsSlice';
import type { CreatePostInput } from '../../lib/postsApi';
import type { AppDispatch, RootState } from '../../store';

// ─── Crisis banner action ─────────────────────────────────────────────────────
// The crisis notifications slice is not yet built — we use a placeholder action.
// Replace with the real action when notificationsSlice lands in Phase 6.
const SHOW_CRISIS_BANNER = 'notifications/showCrisisBanner' as const;

// ─── Create post ─────────────────────────────────────────────────────────────

export const createPostThunk = createAsyncThunk<
  { id: string; crisisDetected: boolean },
  CreatePostInput,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'posts/create',
  async (input, { dispatch, rejectWithValue }) => {
    dispatch(composeSubmitting());
    try {
      const result = await postsApi.createPost(input);

      // Add the created post to the byId map
      dispatch(postAdded(result.post));
      dispatch(composeSuccess());

      // Crisis detection — unconditional and immediate (PRD §6.4)
      if (result.crisisDetected && result.crisisResources) {
        dispatch({
          type:    SHOW_CRISIS_BANNER,
          payload: { resources: result.crisisResources },
        });
      }

      return { id: result.post.id, crisisDetected: result.crisisDetected };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish post';
      dispatch(composeErrorAction(message));
      return rejectWithValue(message);
    }
  }
);

// ─── Edit post ────────────────────────────────────────────────────────────────

export const editPostThunk = createAsyncThunk<
  void,
  { id: string; body: string },
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'posts/edit',
  async ({ id, body }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await postsApi.editPost(id, body);
      dispatch(postUpdated(updated)); return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to edit post';
      return rejectWithValue(message);
    }
  }
);

// ─── Delete post ─────────────────────────────────────────────────────────────

export const deletePostThunk = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'posts/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await postsApi.deletePost(id);
      dispatch(postRemoved(id)); return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      return rejectWithValue(message);
    }
  }
);

// ─── Fetch single post ────────────────────────────────────────────────────────

export const fetchPostThunk = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'posts/fetch',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const result = await postsApi.getPost(id);
      // Only add to store if it's a full (published) post, not a redirect object
      if ('body' in result) {
        dispatch(postAdded(result));
      }
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load post';
      return rejectWithValue(message);
    }
  }
);

// ─── Fetch author's posts ─────────────────────────────────────────────────────

export const fetchMyPostsThunk = createAsyncThunk<
  void,
  { cursor?: string; limit?: number } | undefined,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'posts/fetchMy',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const result = await postsApi.getMyPosts(params?.cursor, params?.limit);
      dispatch(myPostsLoaded({ posts: result.posts, nextCursor: result.nextCursor })); return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load your posts';
      return rejectWithValue(message);
    }
  }
);

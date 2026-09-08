/**
 * discoveryThunks.ts — Redux thunks for discovery: home feed, category, YANA, saves.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as discoveryApi from '../../lib/discoveryApi';
import {
  feedLoading, feedLoaded, feedError,
  categoryPostsLoading, categoryPostsLoaded, categoryPostsError,
  activeCategorySet,
  yanaLoading, yanaLoaded,
  savedLoading, savedLoaded,
} from './discoverySlice';
import type { AppDispatch, RootState } from '../../store';
import type { CategoryPost } from './discoverySlice';

// ─── fetchHomeFeedThunk ───────────────────────────────────────────────────────

export const fetchHomeFeedThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'discovery/fetchHomeFeed',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(feedLoading());
    try {
      const result = await discoveryApi.getHomeFeed();
      dispatch(feedLoaded({ primary: result.primary, secondary: result.secondary })); return;
    } catch {
      dispatch(feedError('Failed to load your feed. Please try again.'));
      return rejectWithValue('Failed to load feed.');
    }
  }
);

// ─── fetchCategoryFeedThunk ───────────────────────────────────────────────────

export const fetchCategoryFeedThunk = createAsyncThunk<
  void,
  { slug: string; cursor?: string; append?: boolean },
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'discovery/fetchCategoryFeed',
  async ({ slug, cursor, append = false }, { dispatch, rejectWithValue }) => {
    if (!append) dispatch(activeCategorySet(slug));
    dispatch(categoryPostsLoading());
    try {
      const result = await discoveryApi.getCategoryFeed(slug, cursor);
      // Map API posts to CategoryPost shape for the slice
      const posts: CategoryPost[] = result.posts.map((p) => ({
        id:          p.id,
        body:        p.body,
        sameCount:   p.reactionCounts.same,
        publishedAt: p.publishedAt,
        categoryId:  p.categoryIds[0] ?? slug,
      }));
      dispatch(categoryPostsLoaded({ posts, cursor: result.nextCursor, append })); return;
    } catch {
      dispatch(categoryPostsError('Failed to load category posts.'));
      return rejectWithValue('Failed to load category feed.');
    }
  }
);

// ─── fetchYanaStatsThunk ──────────────────────────────────────────────────────

export const fetchYanaStatsThunk = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; rejectValue: string }
>(
  'discovery/fetchYanaStats',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(yanaLoading());
    try {
      const result = await discoveryApi.getYanaStats();
      dispatch(yanaLoaded(result.entries)); return;
    } catch {
      dispatch(yanaLoaded([]));
      return rejectWithValue('Failed to load stats.');
    }
  }
);

// ─── fetchSavedPostsThunk ─────────────────────────────────────────────────────

export const fetchSavedPostsThunk = createAsyncThunk<
  void,
  { cursor?: string; append?: boolean },
  { dispatch: AppDispatch; rejectValue: string }
>(
  'discovery/fetchSavedPosts',
  async ({ cursor, append = false }, { dispatch, rejectWithValue }) => {
    dispatch(savedLoading());
    try {
      const result = await discoveryApi.getSavedPosts(cursor);
      dispatch(savedLoaded({ posts: result.posts, cursor: result.nextCursor, append })); return;
    } catch {
      return rejectWithValue('Failed to load saved posts.');
    }
  }
);

// ─── savePostThunk ────────────────────────────────────────────────────────────

export const savePostThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'discovery/savePost',
  async (postId, { rejectWithValue }) => {
    try {
      await discoveryApi.savePost(postId); return;
    } catch {
      return rejectWithValue('Failed to save post.');
    }
  }
);

// ─── unsavePostThunk ──────────────────────────────────────────────────────────

export const unsavePostThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'discovery/unsavePost',
  async (postId, { rejectWithValue }) => {
    try {
      await discoveryApi.unsavePost(postId); return;
    } catch {
      return rejectWithValue('Failed to unsave post.');
    }
  }
);

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Public alias snapshot — the only identity surface on a post */
export interface AliasSnapshot {
  readonly name: string;
  readonly avatarSeed: string;
}

export interface Post {
  readonly id: string;
  readonly body: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly stateLabel: string;         // 'Current' | 'Past' | 'Exploratory'
  readonly authorAlias: AliasSnapshot;
  readonly sameCount: number;
  readonly totalReactionCount: number;
  readonly responseCount: number;
  readonly publishedAt: string;        // ISO timestamp
  readonly isOwn: boolean;
  readonly hasReacted: boolean;
  readonly hasSaved: boolean;
}

export type PostsStatus = 'idle' | 'loading' | 'refreshing' | 'error';

export interface PostsState {
  /** Primary daily experience — the editorial feature card */
  primaryPost: Post | null;
  /** Secondary discovery list — up to 5 items */
  secondaryPosts: Post[];
  /** Cursor for next page of secondary posts */
  nextCursor: string | null;
  status: PostsStatus;
  error: string | null;
  /** Set of post IDs the user has already seen today — prevents duplicates */
  seenPostIds: string[];
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: PostsState = {
  primaryPost: null,
  secondaryPosts: [],
  nextCursor: null,
  status: 'idle',
  error: null,
  seenPostIds: [],
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    feedLoading(state) {
      state.status = 'loading';
      state.error = null;
    },

    feedLoaded(
      state,
      action: PayloadAction<{
        primaryPost: Post | null;
        secondaryPosts: Post[];
        nextCursor: string | null;
      }>
    ) {
      state.primaryPost = action.payload.primaryPost;
      state.secondaryPosts = action.payload.secondaryPosts;
      state.nextCursor = action.payload.nextCursor;
      state.status = 'idle';
      state.error = null;

      // Track all loaded post IDs as seen
      const ids: string[] = [];
      if (action.payload.primaryPost) ids.push(action.payload.primaryPost.id);
      action.payload.secondaryPosts.forEach((p) => ids.push(p.id));
      state.seenPostIds = [...new Set([...state.seenPostIds, ...ids])];
    },

    feedError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },

    feedRefreshing(state) {
      state.status = 'refreshing';
      state.error = null;
    },

    /** Optimistically update SAME count when user reacts */
    postSameCountUpdated(
      state,
      action: PayloadAction<{ postId: string; delta: 1 | -1 }>
    ) {
      const { postId, delta } = action.payload;
      if (state.primaryPost?.id === postId) {
        state.primaryPost = {
          ...state.primaryPost,
          sameCount: Math.max(0, state.primaryPost.sameCount + delta),
          hasReacted: delta === 1,
        };
      }
      const secondary = state.secondaryPosts.find((p) => p.id === postId);
      if (secondary) {
        const idx = state.secondaryPosts.indexOf(secondary);
        state.secondaryPosts[idx] = {
          ...secondary,
          sameCount: Math.max(0, secondary.sameCount + delta),
          hasReacted: delta === 1,
        };
      }
    },

    postSaveToggled(state, action: PayloadAction<{ postId: string; saved: boolean }>) {
      const { postId, saved } = action.payload;
      if (state.primaryPost?.id === postId) {
        state.primaryPost = { ...state.primaryPost, hasSaved: saved };
      }
      const idx = state.secondaryPosts.findIndex((p) => p.id === postId);
      if (idx !== -1) {
        const post = state.secondaryPosts[idx];
        if (post) {
          state.secondaryPosts[idx] = { ...post, hasSaved: saved };
        }
      }
    },

    feedCleared(state) {
      state.primaryPost = null;
      state.secondaryPosts = [];
      state.nextCursor = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const {
  feedLoading,
  feedLoaded,
  feedError,
  feedRefreshing,
  postSameCountUpdated,
  postSaveToggled,
  feedCleared,
} = postsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectPrimaryPost     = (state: RootState): Post | null => state.posts.primaryPost;
export const selectSecondaryPosts  = (state: RootState): Post[]      => state.posts.secondaryPosts;
export const selectPostsStatus     = (state: RootState): PostsStatus => state.posts.status;
export const selectPostsError      = (state: RootState): string | null => state.posts.error;
export const selectNextCursor      = (state: RootState): string | null => state.posts.nextCursor;
export const selectPostById = (postId: string) =>
  (state: RootState): Post | undefined => {
    if (state.posts.primaryPost?.id === postId) return state.posts.primaryPost;
    return state.posts.secondaryPosts.find((p) => p.id === postId);
  };

export default postsSlice.reducer;

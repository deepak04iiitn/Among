import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { PostExperienceState, PostVisibility } from '../../constants/postStates';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Public alias snapshot — the only identity surface on a post */
export interface AliasSnapshot {
  readonly name: string;
  readonly avatarSeed: string;
}

export interface ReactionCounts {
  readonly current:     number;
  readonly past:        number;
  readonly considering: number;
  readonly same:        number;
  readonly iUnderstand: number;
  readonly iLearned:    number;
  readonly iDisagree:   number;
  readonly tellMeMore:  number;
}

/** Full post shape — used in byId map and compose responses */
export interface Post {
  readonly id:              string;
  readonly body:            string;
  readonly categoryIds:     string[];
  readonly state:           PostExperienceState;
  readonly visibilityScope: PostVisibility;
  readonly status:          string;
  readonly authorAlias:     string;
  readonly authorAvatarSeed: string;
  readonly publishedAt:     string;
  readonly editableUntil:   string;
  readonly editedAt:        string | null;
  readonly reactionCounts:  ReactionCounts;
  readonly isOwnPost:       boolean;
}

/** Slim shape for feed cards (keeps backward compat with discovery slice) */
export interface FeedPost {
  readonly id: string;
  readonly body: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly stateLabel: string;
  readonly authorAlias: AliasSnapshot;
  readonly sameCount: number;
  readonly totalReactionCount: number;
  readonly responseCount: number;
  readonly publishedAt: string;
  readonly isOwn: boolean;
  readonly hasReacted: boolean;
  readonly hasSaved: boolean;
}

export type DraftPost = Pick<Post, 'body' | 'categoryIds' | 'state' | 'visibilityScope'>;

export type PostsStatus = 'idle' | 'loading' | 'refreshing' | 'error';

export interface PostsState {
  /** Primary daily experience — the editorial feature card */
  primaryPost: FeedPost | null;
  /** Secondary discovery list — up to 5 items */
  secondaryPosts: FeedPost[];
  /** Cursor for next page of secondary posts */
  nextCursor: string | null;
  status: PostsStatus;
  error: string | null;
  /** Set of post IDs the user has already seen today — prevents duplicates */
  seenPostIds: string[];

  /** Full posts by ID — populated by create, fetch, edit */
  byId: Record<string, Post>;
  /** Ordered list of the current user's own post IDs */
  myPosts: string[];
  /** Draft state while composing */
  draftPost: DraftPost | null;
  /** Whether a post submission is in-flight */
  submitting: boolean;
  /** Compose / submit error */
  composeError: string | null;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: PostsState = {
  primaryPost:  null,
  secondaryPosts: [],
  nextCursor:   null,
  status:       'idle',
  error:        null,
  seenPostIds:  [],
  byId:         {},
  myPosts:      [],
  draftPost:    null,
  submitting:   false,
  composeError: null,
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
        primaryPost: FeedPost | null;
        secondaryPosts: FeedPost[];
        nextCursor: string | null;
      }>
    ) {
      state.primaryPost = action.payload.primaryPost;
      state.secondaryPosts = action.payload.secondaryPosts;
      state.nextCursor = action.payload.nextCursor;
      state.status = 'idle';
      state.error = null;

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
      state.primaryPost    = null;
      state.secondaryPosts = [];
      state.nextCursor     = null;
      state.status         = 'idle';
      state.error          = null;
    },

    // ─── Compose / full post actions ───────────────────────────────────────

    postAdded(state, action: PayloadAction<Post>) {
      const post = action.payload;
      state.byId[post.id] = post;
      // Prepend to author's post list
      if (!state.myPosts.includes(post.id)) {
        state.myPosts = [post.id, ...state.myPosts];
      }
    },

    postUpdated(state, action: PayloadAction<Post>) {
      state.byId[action.payload.id] = action.payload;
    },

    postRemoved(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.byId[id];
      state.myPosts = state.myPosts.filter((pid) => pid !== id);
    },

    myPostsLoaded(
      state,
      action: PayloadAction<{ posts: Post[]; nextCursor: string | null }>
    ) {
      action.payload.posts.forEach((p) => { state.byId[p.id] = p; });
      const newIds = action.payload.posts.map((p) => p.id);
      state.myPosts = [...new Set([...state.myPosts, ...newIds])];
    },

    draftUpdated(state, action: PayloadAction<DraftPost | null>) {
      state.draftPost = action.payload;
    },

    composeSubmitting(state) {
      state.submitting  = true;
      state.composeError = null;
    },

    composeSuccess(state) {
      state.submitting  = false;
      state.composeError = null;
      state.draftPost   = null;
    },

    composeError(state, action: PayloadAction<string>) {
      state.submitting  = false;
      state.composeError = action.payload;
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
  postAdded,
  postUpdated,
  postRemoved,
  myPostsLoaded,
  draftUpdated,
  composeSubmitting,
  composeSuccess,
  composeError: composeErrorAction,
} = postsSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectPrimaryPost    = (state: RootState): FeedPost | null   => state.posts.primaryPost;
export const selectSecondaryPosts = (state: RootState): FeedPost[]        => state.posts.secondaryPosts;
export const selectPostsStatus    = (state: RootState): PostsStatus       => state.posts.status;
export const selectPostsError     = (state: RootState): string | null     => state.posts.error;
export const selectNextCursor     = (state: RootState): string | null     => state.posts.nextCursor;
export const selectPostById       = (id: string) =>
  (state: RootState): Post | undefined => state.posts.byId[id];
export const selectMyPosts        = (state: RootState): Post[] =>
  state.posts.myPosts.map((id) => state.posts.byId[id]).filter(Boolean) as Post[];
export const selectDraftPost      = (state: RootState): DraftPost | null  => state.posts.draftPost;
export const selectSubmitting     = (state: RootState): boolean           => state.posts.submitting;
export const selectComposeError   = (state: RootState): string | null     => state.posts.composeError;

export default postsSlice.reducer;

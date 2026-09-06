import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { ApiPost, YanaStatEntry } from '../../lib/discoveryApi';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Category {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly relatedCategoryIds: string[];
}

export interface CategoryPost {
  readonly id: string;
  readonly body: string;
  readonly sameCount: number;
  readonly publishedAt: string;
  readonly categoryId: string;
}

export type DiscoveryStatus = 'idle' | 'loading' | 'error';

export interface DiscoveryState {
  // ─── Home feed ──────────────────────────────────────────────────────────
  primaryPost:       ApiPost | null;
  secondaryPosts:    ApiPost[];
  feedFetched:       boolean;
  feedLoading:       boolean;
  feedError:         string | null;

  // ─── Category feed ───────────────────────────────────────────────────────
  categories: Category[];
  /** Currently viewed category slug */
  activeCategory: string | null;
  /** Posts for the currently active category */
  categoryPosts: CategoryPost[];
  categoryPostsCursor: string | null;
  categoriesStatus: DiscoveryStatus;
  postsStatus: DiscoveryStatus;
  error: string | null;

  // ─── "You Are Not Alone" ─────────────────────────────────────────────────
  yanaStats:        YanaStatEntry[];
  yanaLoading:      boolean;

  // ─── Saved posts ─────────────────────────────────────────────────────────
  savedPosts:       ApiPost[];
  savedPostsCursor: string | null;
  savedLoading:     boolean;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: DiscoveryState = {
  // Home feed
  primaryPost:    null,
  secondaryPosts: [],
  feedFetched:    false,
  feedLoading:    false,
  feedError:      null,

  // Category feed
  categories:          [],
  activeCategory:      null,
  categoryPosts:       [],
  categoryPostsCursor: null,
  categoriesStatus:    'idle',
  postsStatus:         'idle',
  error:               null,

  // YANA
  yanaStats:   [],
  yanaLoading: false,

  // Saved
  savedPosts:       [],
  savedPostsCursor: null,
  savedLoading:     false,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    // ─── Home feed ────────────────────────────────────────────────────────
    feedLoading(state) {
      state.feedLoading = true;
      state.feedError   = null;
    },

    feedLoaded(
      state,
      action: PayloadAction<{ primary: ApiPost | null; secondary: ApiPost[] }>
    ) {
      state.primaryPost    = action.payload.primary;
      state.secondaryPosts = action.payload.secondary;
      state.feedFetched    = true;
      state.feedLoading    = false;
      state.feedError      = null;
    },

    feedError(state, action: PayloadAction<string>) {
      state.feedLoading = false;
      state.feedError   = action.payload;
    },

    // ─── Categories ───────────────────────────────────────────────────────
    categoriesLoading(state) {
      state.categoriesStatus = 'loading';
      state.error = null;
    },

    categoriesLoaded(state, action: PayloadAction<Category[]>) {
      state.categories = action.payload;
      state.categoriesStatus = 'idle';
      state.error = null;
    },

    categoriesError(state, action: PayloadAction<string>) {
      state.categoriesStatus = 'error';
      state.error = action.payload;
    },

    activeCategorySet(state, action: PayloadAction<string>) {
      state.activeCategory = action.payload;
      state.categoryPosts = [];
      state.categoryPostsCursor = null;
    },

    categoryPostsLoading(state) {
      state.postsStatus = 'loading';
    },

    categoryPostsLoaded(
      state,
      action: PayloadAction<{ posts: CategoryPost[]; cursor: string | null; append: boolean }>
    ) {
      const { posts, cursor, append } = action.payload;
      state.categoryPosts = append
        ? [...state.categoryPosts, ...posts]
        : posts;
      state.categoryPostsCursor = cursor;
      state.postsStatus = 'idle';
    },

    categoryPostsError(state, action: PayloadAction<string>) {
      state.postsStatus = 'error';
      state.error = action.payload;
    },

    // ─── "You Are Not Alone" ──────────────────────────────────────────────
    yanaLoading(state) {
      state.yanaLoading = true;
    },

    yanaLoaded(state, action: PayloadAction<YanaStatEntry[]>) {
      state.yanaStats   = action.payload;
      state.yanaLoading = false;
    },

    // ─── Saved posts ──────────────────────────────────────────────────────
    savedLoading(state) {
      state.savedLoading = true;
    },

    savedLoaded(
      state,
      action: PayloadAction<{ posts: ApiPost[]; cursor: string | null; append: boolean }>
    ) {
      const { posts, cursor, append } = action.payload;
      state.savedPosts       = append ? [...state.savedPosts, ...posts] : posts;
      state.savedPostsCursor = cursor;
      state.savedLoading     = false;
    },
  },
});

export const {
  feedLoading,
  feedLoaded,
  feedError,
  categoriesLoading,
  categoriesLoaded,
  categoriesError,
  activeCategorySet,
  categoryPostsLoading,
  categoryPostsLoaded,
  categoryPostsError,
  yanaLoading,
  yanaLoaded,
  savedLoading,
  savedLoaded,
} = discoverySlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

// ─── Home feed selectors ──────────────────────────────────────────────────────
export const selectPrimaryPost    = (state: RootState): ApiPost | null   => state.discovery.primaryPost;
export const selectSecondaryPosts = (state: RootState): ApiPost[]        => state.discovery.secondaryPosts;
export const selectFeedFetched    = (state: RootState): boolean          => state.discovery.feedFetched;
export const selectFeedLoading    = (state: RootState): boolean          => state.discovery.feedLoading;
export const selectFeedError      = (state: RootState): string | null    => state.discovery.feedError;

// ─── Category selectors ────────────────────────────────────────────────────────
export const selectCategories          = (state: RootState): Category[]      => state.discovery.categories;
export const selectActiveCategory      = (state: RootState): string | null   => state.discovery.activeCategory;
export const selectCategoryPosts       = (state: RootState): CategoryPost[]  => state.discovery.categoryPosts;
export const selectCategoriesStatus    = (state: RootState): DiscoveryStatus => state.discovery.categoriesStatus;
export const selectCategoryPostsStatus = (state: RootState): DiscoveryStatus => state.discovery.postsStatus;
export const selectCategoryBySlug = (slug: string) =>
  (state: RootState): Category | undefined =>
    state.discovery.categories.find((c) => c.slug === slug);

// ─── YANA selectors ────────────────────────────────────────────────────────────
export const selectYanaStats   = (state: RootState): YanaStatEntry[] => state.discovery.yanaStats;
export const selectYanaLoading = (state: RootState): boolean         => state.discovery.yanaLoading;

// ─── Saved posts selectors ────────────────────────────────────────────────────
export const selectSavedPosts       = (state: RootState): ApiPost[]      => state.discovery.savedPosts;
export const selectSavedPostsCursor = (state: RootState): string | null  => state.discovery.savedPostsCursor;
export const selectSavedLoading     = (state: RootState): boolean        => state.discovery.savedLoading;

export default discoverySlice.reducer;

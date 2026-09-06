import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

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
  categories: Category[];
  /** Currently viewed category slug */
  activeCategory: string | null;
  /** Posts for the currently active category */
  categoryPosts: CategoryPost[];
  categoryPostsCursor: string | null;
  categoriesStatus: DiscoveryStatus;
  postsStatus: DiscoveryStatus;
  error: string | null;
}

// ─── Initial state ───────────────────────────────────────────────────────────

const initialState: DiscoveryState = {
  categories: [],
  activeCategory: null,
  categoryPosts: [],
  categoryPostsCursor: null,
  categoriesStatus: 'idle',
  postsStatus: 'idle',
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

export const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
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
  },
});

export const {
  categoriesLoading,
  categoriesLoaded,
  categoriesError,
  activeCategorySet,
  categoryPostsLoading,
  categoryPostsLoaded,
  categoryPostsError,
} = discoverySlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectCategories         = (state: RootState): Category[]      => state.discovery.categories;
export const selectActiveCategory     = (state: RootState): string | null   => state.discovery.activeCategory;
export const selectCategoryPosts      = (state: RootState): CategoryPost[]  => state.discovery.categoryPosts;
export const selectCategoriesStatus   = (state: RootState): DiscoveryStatus => state.discovery.categoriesStatus;
export const selectCategoryPostsStatus = (state: RootState): DiscoveryStatus => state.discovery.postsStatus;
export const selectCategoryBySlug = (slug: string) =>
  (state: RootState): Category | undefined =>
    state.discovery.categories.find((c) => c.slug === slug);

export default discoverySlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../store/rootReducer';
import {
  categoriesLoading,
  categoriesLoaded,
  categoriesError,
  activeCategorySet,
  categoryPostsLoading,
  categoryPostsLoaded,
  categoryPostsError,
  selectCategories,
  selectActiveCategory,
  selectCategoryPosts,
  selectCategoriesStatus,
  selectCategoryPostsStatus,
  selectCategoryBySlug,
  type Category,
  type CategoryPost,
} from './discoverySlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: rootReducer });
}

const mockCategory = (overrides?: Partial<Category>): Category => ({
  id: 'loneliness',
  slug: 'loneliness',
  label: 'Loneliness',
  description: 'Feeling alone.',
  icon: 'circle',
  relatedCategoryIds: [],
  ...overrides,
});

const mockPost = (overrides?: Partial<CategoryPost>): CategoryPost => ({
  id: 'p1',
  body: 'I feel alone sometimes.',
  sameCount: 5,
  publishedAt: '2026-01-01T00:00:00.000Z',
  categoryId: 'loneliness',
  ...overrides,
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('discoverySlice — initial state', () => {
  it('has empty categories', () => {
    const store = makeStore();
    expect(selectCategories(store.getState())).toEqual([]);
  });

  it('has null activeCategory', () => {
    const store = makeStore();
    expect(selectActiveCategory(store.getState())).toBeNull();
  });

  it('has idle categoriesStatus', () => {
    const store = makeStore();
    expect(selectCategoriesStatus(store.getState())).toBe('idle');
  });

  it('has idle postsStatus', () => {
    const store = makeStore();
    expect(selectCategoryPostsStatus(store.getState())).toBe('idle');
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe('categoriesLoading', () => {
  it('sets categoriesStatus to loading', () => {
    const store = makeStore();
    store.dispatch(categoriesLoading());
    expect(selectCategoriesStatus(store.getState())).toBe('loading');
  });
});

describe('categoriesLoaded', () => {
  it('stores categories and resets status', () => {
    const store = makeStore();
    const cats = [mockCategory(), mockCategory({ id: 'work', slug: 'work', label: 'Work' })];
    store.dispatch(categoriesLoaded(cats));
    expect(selectCategories(store.getState())).toEqual(cats);
    expect(selectCategoriesStatus(store.getState())).toBe('idle');
  });

  it('empty array clears categories', () => {
    const store = makeStore();
    store.dispatch(categoriesLoaded([mockCategory()]));
    store.dispatch(categoriesLoaded([]));
    expect(selectCategories(store.getState())).toEqual([]);
  });
});

describe('categoriesError', () => {
  it('sets status to error', () => {
    const store = makeStore();
    store.dispatch(categoriesError('Failed'));
    expect(selectCategoriesStatus(store.getState())).toBe('error');
  });
});

// ─── Active category ──────────────────────────────────────────────────────────

describe('activeCategorySet', () => {
  it('sets activeCategory and clears posts', () => {
    const store = makeStore();
    store.dispatch(categoryPostsLoaded({
      posts: [mockPost()],
      cursor: null,
      append: false,
    }));
    store.dispatch(activeCategorySet('work'));
    expect(selectActiveCategory(store.getState())).toBe('work');
    expect(selectCategoryPosts(store.getState())).toEqual([]);
  });
});

// ─── Category posts ───────────────────────────────────────────────────────────

describe('categoryPostsLoading', () => {
  it('sets postsStatus to loading', () => {
    const store = makeStore();
    store.dispatch(categoryPostsLoading());
    expect(selectCategoryPostsStatus(store.getState())).toBe('loading');
  });
});

describe('categoryPostsLoaded', () => {
  it('replaces posts when append = false', () => {
    const store = makeStore();
    store.dispatch(categoryPostsLoaded({
      posts: [mockPost({ id: 'p1' }), mockPost({ id: 'p2' })],
      cursor: 'next-cursor',
      append: false,
    }));
    expect(selectCategoryPosts(store.getState())).toHaveLength(2);
    expect(selectCategoryPostsStatus(store.getState())).toBe('idle');
  });

  it('appends posts when append = true', () => {
    const store = makeStore();
    store.dispatch(categoryPostsLoaded({
      posts: [mockPost({ id: 'p1' })],
      cursor: null,
      append: false,
    }));
    store.dispatch(categoryPostsLoaded({
      posts: [mockPost({ id: 'p2' })],
      cursor: null,
      append: true,
    }));
    expect(selectCategoryPosts(store.getState())).toHaveLength(2);
  });
});

describe('categoryPostsError', () => {
  it('sets postsStatus to error', () => {
    const store = makeStore();
    store.dispatch(categoryPostsError('Failed'));
    expect(selectCategoryPostsStatus(store.getState())).toBe('error');
  });
});

// ─── selectCategoryBySlug ─────────────────────────────────────────────────────

describe('selectCategoryBySlug', () => {
  it('returns the matching category', () => {
    const store = makeStore();
    const cat = mockCategory({ slug: 'work', label: 'Work' });
    store.dispatch(categoriesLoaded([mockCategory(), cat]));
    expect(selectCategoryBySlug('work')(store.getState())).toEqual(cat);
  });

  it('returns undefined for unknown slug', () => {
    const store = makeStore();
    store.dispatch(categoriesLoaded([mockCategory()]));
    expect(selectCategoryBySlug('unknown')(store.getState())).toBeUndefined();
  });
});

/**
 * CategoryBrowse.tsx — Browse all experience categories.
 *
 * Design rules:
 *  - Single-column editorial layout — no card grid for main content.
 *  - No colorful category chips — categories distinguished by label/typography only.
 *  - Each category links to its explore page.
 *  - Each category cross-links to its related categories (SEO FR-SEO-16 — min 3 internal links).
 *
 * SEO:
 *  - FR-SEO-4: URLs use human-readable slugs (e.g. /explore/loneliness).
 *  - FR-SEO-16: Related category links ensure minimum 3 contextual internal links per page.
 */
import * as React from 'react';
import Link from 'next/link';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { ROUTES } from '../../constants/routes';

export interface CategoryBrowseProps {
  /** Highlight a specific category (e.g. currently active one) */
  activeCategoryId?: string;
  /** Max categories to show (default: all) */
  limit?: number;
}

export function CategoryBrowse({ activeCategoryId, limit }: CategoryBrowseProps) {
  const categories = limit
    ? EXPERIENCE_CATEGORIES.slice(0, limit)
    : EXPERIENCE_CATEGORIES;

  return (
    <nav aria-label="Browse all experience categories">
      <ul className="divide-y divide-[var(--color-border)]">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <li key={category.id}>
              <Link
                href={ROUTES.EXPLORE_CATEGORY(category.slug)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex flex-col gap-1 py-5 group
                  transition-opacity duration-100
                  hover:opacity-80
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                  rounded-sm
                `}
              >
                <span
                  className={`
                    text-body-lg
                    ${isActive
                      ? 'font-medium text-[var(--color-text)]'
                      : 'text-[var(--color-text)]'
                    }
                  `}
                >
                  {category.displayName}
                </span>
                <span className="text-body text-[var(--color-text-muted)]">
                  {category.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Related categories strip (for SEO FR-SEO-16) ────────────────────────────

export interface RelatedCategoriesProps {
  categoryId: string;
}

export function RelatedCategories({ categoryId }: RelatedCategoriesProps) {
  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === categoryId);
  if (!category || category.relatedCategoryIds.length === 0) return null;

  const related = category.relatedCategoryIds
    .map((id) => EXPERIENCE_CATEGORIES.find((c) => c.id === id))
    .filter(Boolean);

  if (related.length === 0) return null;

  return (
    <nav aria-label="Related experience categories" className="space-y-3">
      <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-widest">
        Related experiences
      </p>
      <ul className="flex flex-wrap gap-3">
        {related.map((cat) => (
          <li key={cat!.id}>
            <Link
              href={ROUTES.EXPLORE_CATEGORY(cat!.slug)}
              className="
                text-ui text-[var(--color-text-secondary)]
                underline underline-offset-4 decoration-[var(--color-border)]
                hover:text-[var(--color-text)] hover:decoration-[var(--color-text-muted)]
                transition-colors duration-100
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
              "
            >
              {cat!.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

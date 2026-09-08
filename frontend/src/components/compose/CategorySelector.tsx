'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { POST_CATEGORY_MAX, POST_CATEGORY_MIN } from '../../constants/limits';

/**
 * CategorySelector — for the compose flow.
 *
 * Design (Plan §7B.6 — Compose Page):
 * - Each category: typographic pill with `font-ui text-ui rounded-pill border border-border`.
 * - Selected: `border-accent text-accent bg-accent-subtle`. No colored chips.
 * - No icons, no color fills beyond the rose selected state.
 * - Shows `"X of Y selected"` count at the bottom — updates live.
 */

export interface CategorySelectorProps {
  selectedIds: string[];
  onChange:    (ids: string[]) => void;
  /** Max selections allowed. Defaults to POST_CATEGORY_MAX */
  maxSelections?: number;
  /** Min selections required. Defaults to POST_CATEGORY_MIN */
  minSelections?: number;
  disabled?: boolean;
  className?: string;
}

export default function CategorySelector({
  selectedIds,
  onChange,
  maxSelections = POST_CATEGORY_MAX,
  minSelections = POST_CATEGORY_MIN,
  disabled      = false,
  className,
}: CategorySelectorProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      onChange(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, id]);
    }
  };

  const count    = selectedIds.length;
  const atMax    = count >= maxSelections;
  const atMin    = count >= minSelections;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        role="group"
        aria-label={`Select up to ${maxSelections} categories`}
        className="flex flex-wrap gap-2"
      >
        {EXPERIENCE_CATEGORIES.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          const isDisabled = disabled || (!isSelected && atMax);

          return (
            <button
              key={cat.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => toggle(cat.id)}
              className={cn(
                'inline-flex items-center gap-1',
                'px-3 py-1.5',
                'rounded-[var(--radius-pill)]',
                'border',
                'text-ui font-[var(--font-ui)]',
                'transition-all duration-[var(--duration-fast)]',
                'focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-[var(--color-accent)]',
                'focus-visible:outline-offset-1',
                'min-h-[36px]',
                isSelected
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent',
                isDisabled && !isSelected && 'opacity-40 cursor-not-allowed',
              )}
            >
              {/* Indigo selection dot (instead of a checkbox icon) */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0"
                />
              )}
              {cat.displayName}
            </button>
          );
        })}
      </div>

      {/* Live selection count */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'text-caption font-[var(--font-ui)]',
          atMin
            ? 'text-[var(--color-text-muted)]'
            : 'text-[var(--color-text-muted)]',
        )}
      >
        {count} of {maxSelections} selected
        {count < minSelections && (
          <span className="ml-1 text-[var(--color-warn)]">
            (minimum {minSelections})
          </span>
        )}
      </p>
    </div>
  );
}

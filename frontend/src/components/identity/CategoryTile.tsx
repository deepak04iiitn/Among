'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * CategoryTile — used in the onboarding category selection flow.
 *
 * Design (Plan §7B.6 — Onboarding Category Selection):
 *  - Large typographic label in `font-editorial text-title` on white.
 *  - Thin `border-border`, `rounded-lg`.
 *  - Descriptor line below: `text-caption text-text-muted`.
 *  - On selection: border → `border-accent`, bg → `bg-accent-subtle`.
 *    A small indigo dot appears in the top-right corner.
 *    (No checkmark icon — a dot feels more human, less form-checkbox.)
 *  - Selection count shown externally (CategorySelector) — not per-tile.
 */

export interface CategoryTileProps {
  id:          string;
  label:       string;
  description: string;
  isSelected:  boolean;
  onToggle:    (id: string) => void;
  isDisabled?: boolean;
  className?:  string;
}

export default function CategoryTile({
  id,
  label,
  description,
  isSelected,
  onToggle,
  isDisabled = false,
  className,
}: CategoryTileProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => !isDisabled && onToggle(id)}
      className={cn(
        'relative w-full text-left',
        'p-5 rounded-[var(--radius-lg)]',
        'border',
        'transition-all duration-[var(--duration-fast)]',
        'focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-[var(--color-accent)]',
        'focus-visible:outline-offset-1',
        // Selected state
        isSelected
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-strong)]',
        // Disabled
        isDisabled && !isSelected && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {/* ─── Indigo dot — selected indicator (top-right) ─── */}
      {isSelected && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-3 right-3',
            'w-2 h-2 rounded-full',
            'bg-[var(--color-accent)]',
            'animate-[fadeIn_150ms_var(--ease-out)_both]',
          )}
        />
      )}

      {/* ─── Label ─── */}
      <span
        className={cn(
          'block font-editorial text-title',
          'mb-1.5',
          isSelected
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-text)]',
        )}
      >
        {label}
      </span>

      {/* ─── Description ─── */}
      <span className="block text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
        {description}
      </span>
    </button>
  );
}

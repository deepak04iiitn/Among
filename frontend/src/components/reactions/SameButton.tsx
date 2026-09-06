/**
 * SameButton.tsx — The primary "SAME" reaction button.
 *
 * Design rules (PRD §7.3):
 *  - A borderless pill with the word "SAME" + count.
 *  - On activation: `border-accent text-accent bg-accent-subtle`.
 *  - No icon — the word IS the button.
 *  - Count is privacy-safe formatted (never raw exact integer).
 *  - Gentle 250ms transition — no confetti, no spring, no celebration.
 */
'use client';

import * as React from 'react';
import { formatCount } from '../../utils/formatCount';

export interface SameButtonProps {
  count:       number;
  isActive:    boolean;
  loading?:    boolean;
  onToggle:    () => void;
  postId:      string;
}

export function SameButton({
  count,
  isActive,
  loading = false,
  onToggle,
  postId,
}: SameButtonProps) {
  const displayCount = formatCount(Math.max(0, count));
  const ariaLabel    = isActive
    ? `Remove SAME reaction. ${displayCount} people said SAME`
    : `Say SAME. ${displayCount} people have said SAME`;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      data-testid={`same-button-${postId}`}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        text-ui font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
        min-h-[44px] min-w-[44px]
        ${isActive
          ? 'border border-[var(--color-accent)] text-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
          : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
        }
      `}
    >
      <span>SAME</span>
      {count > 0 && (
        <span
          className="text-caption tabular-nums"
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}

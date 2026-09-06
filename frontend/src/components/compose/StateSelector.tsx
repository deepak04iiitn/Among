'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * StateSelector — "Current / Past / Exploratory" segmented pill control.
 *
 * Design (Plan §7B.6 — Compose Page):
 * - Three options in a single pill outline.
 * - Active option: filled `bg-text text-bg` — inverted.
 * - Feels like a sophisticated selector, not a radio group.
 * - Entirely keyboard navigable (arrow keys, Enter/Space).
 */

export type ExperienceState = 'current' | 'past' | 'exploratory';

interface StateOption {
  readonly value: ExperienceState;
  readonly label: string;
  readonly description: string;
}

const STATE_OPTIONS: readonly StateOption[] = [
  { value: 'current',     label: 'Current',     description: 'This is happening now' },
  { value: 'past',        label: 'Past',        description: 'This happened before' },
  { value: 'exploratory', label: 'Exploratory', description: 'Thinking it through' },
] as const;

export interface StateSelectorProps {
  value:     ExperienceState;
  onChange:  (value: ExperienceState) => void;
  disabled?: boolean;
  className?: string;
}

export default function StateSelector({
  value,
  onChange,
  disabled  = false,
  className,
}: StateSelectorProps) {
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    const total = STATE_OPTIONS.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = STATE_OPTIONS[(idx + 1) % total];
      if (next) onChange(next.value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = STATE_OPTIONS[(idx - 1 + total) % total];
      if (prev) onChange(prev.value);
    }
  };

  const activeOption = STATE_OPTIONS.find((o) => o.value === value);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Segmented pill outline container */}
      <div
        role="radiogroup"
        aria-label="When is this experience?"
        className={cn(
          'inline-flex',
          'rounded-[var(--radius-pill)]',
          'border border-[var(--color-border)]',
          'p-0.5',
          'bg-[var(--color-bg)]',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {STATE_OPTIONS.map((option, idx) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                'px-4 py-1.5',
                'rounded-[var(--radius-pill)]',
                'text-ui font-[var(--font-ui)]',
                'transition-all duration-[var(--duration-fast)]',
                'focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-[var(--color-accent)]',
                'focus-visible:outline-offset-1',
                'select-none',
                isActive
                  ? 'bg-[var(--color-text)] text-[var(--color-bg)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Current selection description — accessible hint */}
      {activeOption && (
        <p
          aria-live="polite"
          className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] italic pl-1"
        >
          {activeOption.description}
        </p>
      )}
    </div>
  );
}

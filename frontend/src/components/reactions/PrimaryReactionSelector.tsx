/**
 * PrimaryReactionSelector.tsx — Radio-style mutually exclusive primary reactions.
 *
 * Options: "I'm going through this now" / "I've been through this" / "I'm considering this"
 * Labels come from `frontend/src/constants/reactionTypes.ts` — never hardcoded here.
 *
 * Design: pill-shaped radio group. Active state uses accent color with border.
 * Inactive items are text-muted with a subtle border.
 */
'use client';

import * as React from 'react';
import { PRIMARY_REACTIONS } from '../../constants/reactionTypes';
import type { PrimaryReactionId } from '../../constants/reactionTypes';

export interface PrimaryReactionSelectorProps {
  selected:  PrimaryReactionId | null;
  loading?:  boolean;
  onChange:  (id: PrimaryReactionId | null) => void;
}

export function PrimaryReactionSelector({
  selected,
  loading = false,
  onChange,
}: PrimaryReactionSelectorProps) {
  function handleClick(id: PrimaryReactionId) {
    // Toggle: clicking the active reaction clears it (sets to null)
    onChange(selected === id ? null : id);
  }

  return (
    <div
      role="radiogroup"
      aria-label="How does this relate to your experience?"
      className="flex flex-wrap gap-2"
    >
      {PRIMARY_REACTIONS.map((reaction) => {
        const isActive = selected === reaction.id;

        return (
          <button
            key={reaction.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={reaction.label}
            title={reaction.description}
            disabled={loading}
            onClick={() => handleClick(reaction.id as PrimaryReactionId)}
            className={`
              px-4 py-2 rounded-full text-ui transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
              min-h-[44px]
              ${isActive
                ? 'border border-[var(--color-accent)] text-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
                : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
              }
            `}
          >
            {reaction.label}
          </button>
        );
      })}
    </div>
  );
}

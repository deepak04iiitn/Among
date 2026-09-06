/**
 * ReactionBar.tsx — Full reaction bar: primary selector + SAME button + other secondary reactions.
 *
 * Handles optimistic updates — counts update immediately, rollback on API error.
 * Never exposes who reacted — only aggregate counts and the user's own state.
 *
 * Layout:
 *  1. `PrimaryReactionSelector` — "I'm going through this" / "I've been through this" / etc.
 *  2. `SameButton` — prominent; above the secondary group
 *  3. Secondary reactions (I understand, I learned, etc.) — additive pills
 */
'use client';

import * as React from 'react';
import { SameButton } from './SameButton';
import { PrimaryReactionSelector } from './PrimaryReactionSelector';
import { ReactionCounts } from './ReactionCounts';
import { SECONDARY_REACTIONS, SECONDARY_REACTION_IDS } from '../../constants/reactionTypes';
import type { PrimaryReactionId, SecondaryReactionId } from '../../constants/reactionTypes';
import { formatCount } from '../../utils/formatCount';
import type { ApiReactionCounts, ApiUserReaction } from '../../lib/reactionsApi';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReactionBarProps {
  postId:     string;
  counts:     ApiReactionCounts;
  myReaction: ApiUserReaction | null;
  loading?:   boolean;
  onSetPrimary:    (id: PrimaryReactionId | null) => void;
  onToggleSecondary: (id: SecondaryReactionId) => void;
  onRemoveAll: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReactionBar({
  postId,
  counts,
  myReaction,
  loading = false,
  onSetPrimary,
  onToggleSecondary,
}: ReactionBarProps) {
  const selectedPrimary    = myReaction?.primaryReaction    ?? null;
  const selectedSecondary  = myReaction?.secondaryReactions ?? [];
  const isSameActive       = selectedSecondary.includes(SECONDARY_REACTION_IDS.SAME);

  function handleToggleSame() {
    onToggleSecondary(SECONDARY_REACTION_IDS.SAME);
  }

  return (
    <div
      className="space-y-4"
      aria-label="React to this experience"
    >
      {/* ─── Primary reactions ─────────────────────────────────────────── */}
      <PrimaryReactionSelector
        selected={selectedPrimary as PrimaryReactionId | null}
        loading={loading}
        onChange={onSetPrimary}
      />

      {/* ─── Divider ────────────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)]" aria-hidden="true" />

      {/* ─── Secondary reactions ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* SAME is the prominent featured reaction */}
        <SameButton
          postId={postId}
          count={counts.same}
          isActive={isSameActive}
          loading={loading}
          onToggle={handleToggleSame}
        />

        {/* Other secondary reactions — smaller pills */}
        {SECONDARY_REACTIONS.filter((r) => r.id !== SECONDARY_REACTION_IDS.SAME).map((reaction) => {
          const isActive = selectedSecondary.includes(reaction.id as SecondaryReactionId);
          const countKey = reactionIdToCountKey(reaction.id as SecondaryReactionId);
          const count    = countKey ? (counts[countKey as keyof ApiReactionCounts] ?? 0) : 0;

          return (
            <button
              key={reaction.id}
              type="button"
              role="checkbox"
              aria-checked={isActive}
              aria-label={`${reaction.label}${count > 0 ? `. ${formatCount(count)} reactions` : ''}`}
              disabled={loading}
              onClick={() => onToggleSecondary(reaction.id as SecondaryReactionId)}
              className={`
                px-3 py-1.5 text-ui transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                min-h-[44px]
                ${isActive
                  ? 'text-[var(--color-accent)] border-b border-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }
              `}
            >
              <span>{reaction.label}</span>
              {count > 0 && (
                <span className="ml-1.5 text-caption tabular-nums" aria-hidden="true">
                  {formatCount(count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Aggregate count summary ──────────────────────────────────── */}
      <ReactionCounts counts={counts} className="pt-1" />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function reactionIdToCountKey(id: SecondaryReactionId): string | null {
  const map: Partial<Record<SecondaryReactionId, string>> = {
    'same':          'same',
    'i-understand':  'iUnderstand',
    'i-learned':     'iLearned',
    'i-disagree':    'iDisagree',
    'tell-me-more':  'tellMeMore',
  };
  return map[id] ?? null;
}

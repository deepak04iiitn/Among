/**
 * ReactionCounts.tsx — Displays all aggregate reaction counts.
 *
 * Design rules:
 *  - Compact, understated — counts are metadata, not the focal point.
 *  - Labels come from `reactionTypes.ts` constants — never hardcoded.
 *  - Zero-count reactions are hidden to avoid visual noise.
 *  - Count numbers use `formatCount` for compact formatting.
 *  - No confetti, no progress bars, no gamification indicators.
 */
import * as React from 'react';
import { SECONDARY_REACTIONS } from '../../constants/reactionTypes';
import type { SecondaryReactionId } from '../../constants/reactionTypes';
import { formatCount } from '../../utils/formatCount';
import type { ApiReactionCounts } from '../../lib/reactionsApi';

// Map the API count keys to reaction IDs
const COUNT_KEY_MAP: Record<string, SecondaryReactionId> = {
  same:        'same',
  iUnderstand: 'i-understand',
  iLearned:    'i-learned',
  iDisagree:   'i-disagree',
  tellMeMore:  'tell-me-more',
} as const;

export interface ReactionCountsProps {
  counts:    ApiReactionCounts;
  className?: string;
}

export function ReactionCounts({ counts, className = '' }: ReactionCountsProps) {
  const items = SECONDARY_REACTIONS.map((reaction) => {
    // Find the matching key in the counts object
    const countKey = Object.entries(COUNT_KEY_MAP).find(([, id]) => id === reaction.id)?.[0];
    const count    = countKey ? (counts[countKey as keyof ApiReactionCounts] ?? 0) : 0;
    return { reaction, count };
  }).filter(({ count }) => count > 0);

  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}
      aria-label="Reaction counts"
    >
      {items.map(({ reaction, count }) => (
        <span
          key={reaction.id}
          className="text-caption text-[var(--color-text-muted)] tabular-nums"
          aria-label={`${formatCount(count)} ${reaction.label}`}
        >
          <span aria-hidden="true">{formatCount(count)}</span>
          {' '}
          <span>{reaction.label}</span>
        </span>
      ))}
    </div>
  );
}

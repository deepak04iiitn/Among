/**
 * PrimaryExperienceCard.tsx — Editorial-weight primary post card.
 *
 * Design rules (PRD §7.3):
 *  - Full body text visible — no truncation for the primary post.
 *  - Body text in `font-editorial text-headline` — editorial reading weight.
 *  - Author alias is the smallest element (bottom, text-caption text-muted).
 *  - No card border, no card background — the text IS the page.
 *  - Generous whitespace. Feels like reading a letter.
 *  - No gradients, no drop shadows, no colorful category chips.
 *  - Reaction bar is included.
 */
'use client';

import * as React from 'react';
import type { ApiPost } from '../../lib/discoveryApi';
import AvatarSVG from '../common/AvatarSVG';
import type { ApiReactionCounts, ApiUserReaction } from '../../lib/reactionsApi';
import { ReactionBar } from '../reactions/ReactionBar';
import type { PrimaryReactionId, SecondaryReactionId } from '../../constants/reactionTypes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

export interface PrimaryExperienceCardProps {
  post:         ApiPost;
  counts:       ApiReactionCounts;
  myReaction:   ApiUserReaction | null;
  reactionLoading?: boolean;
  onSetPrimary:     (id: PrimaryReactionId | null) => void;
  onToggleSecondary: (id: SecondaryReactionId) => void;
  onRemoveAll:       () => void;
  onConversationRequest?: () => void;
}

export function PrimaryExperienceCard({
  post,
  counts,
  myReaction,
  reactionLoading = false,
  onSetPrimary,
  onToggleSecondary,
  onRemoveAll,
  onConversationRequest,
}: PrimaryExperienceCardProps) {
  const categoryLabels = post.categoryIds
    .map((id) => EXPERIENCE_CATEGORIES.find((c) => c.id === id)?.displayName)
    .filter(Boolean);

  return (
    <article
      aria-label="Today's primary experience"
      className="py-16 space-y-10"
    >
      {/* ─── Category labels (text only — no chips) ───────────────── */}
      {categoryLabels.length > 0 && (
        <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-widest">
          {categoryLabels.join(' · ')}
        </p>
      )}

      {/* ─── Body text — THE focal element ────────────────────────── */}
      <div className="max-w-2xl">
        <p
          className="font-editorial text-headline text-[var(--color-text)] leading-relaxed"
          style={{ lineHeight: '1.45' }}
        >
          {post.body}
        </p>
      </div>

      {/* ─── Reaction bar ──────────────────────────────────────────── */}
      <div className="max-w-2xl border-t border-[var(--color-border)] pt-8">
        <ReactionBar
          postId={post.id}
          counts={counts}
          myReaction={myReaction}
          loading={reactionLoading}
          onSetPrimary={onSetPrimary}
          onToggleSecondary={onToggleSecondary}
          onRemoveAll={onRemoveAll}
        />
      </div>

      {/* ─── "Talk to someone" CTA ─────────────────────────────────── */}
      {onConversationRequest && (
        <div className="max-w-2xl">
          <button
            type="button"
            onClick={onConversationRequest}
            className="
              px-5 py-2.5 rounded-full border border-[var(--color-border)]
              text-ui text-[var(--color-text-secondary)]
              hover:border-[var(--color-text-muted)] transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
              min-h-[44px]
            "
            aria-label="Request to talk with someone about this experience"
          >
            Talk to someone →
          </button>
        </div>
      )}

      {/* ─── Author alias — always the smallest element ────────────── */}
      <footer className="max-w-2xl flex items-center gap-2.5">
        <AvatarSVG seed={post.authorAvatarSeed} size="sm" aria-hidden="true" />
        <span className="text-caption text-[var(--color-text-muted)]">
          {post.authorAlias}
        </span>
        <span
          className="text-caption text-[var(--color-text-muted)]"
          aria-label={`Posted ${formatTimeAgo(post.publishedAt)}`}
        >
          · {formatTimeAgo(post.publishedAt)}
        </span>
      </footer>
    </article>
  );
}

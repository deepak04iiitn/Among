import * as React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';

/**
 * Primary Experience Card — the most important surface in AMONG.
 *
 * Design rules (CLAUDE.md §7.3 + Plan §7B.6):
 * - NOT a card. Has no border, no shadow, no container. It IS the page.
 * - Post body: `font-editorial text-headline` — large, reads like a book.
 * - Thin divider line separates body from reactions.
 * - SAME button: pill, word only — no heart/thumbs icon ever.
 * - Author alias: smallest text on the card. Bottom. No avatar shown here.
 * - No profile picture, no share button, no comment count, no menu.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AliasSnapshot {
  readonly name:       string;
  readonly avatarSeed: string;
}

export interface ReactionEntry {
  readonly typeId:      string;
  readonly label:       string;
  readonly count:       number;
  readonly hasReacted?: boolean;
}

export interface ExperienceCardProps {
  id:             string;
  body:           string;
  categoryLabel:  string;
  stateLabel:     string;
  authorAlias:    AliasSnapshot;
  sameCount:      number;
  hasReacted:     boolean;
  hasSaved:       boolean;
  publishedAt:    string;
  /** Called when user presses SAME — parent handles optimistic update */
  onSame?:        (postId: string, currentlyReacted: boolean) => void;
  /** Called when user presses Save */
  onSave?:        (postId: string, currentlySaved: boolean) => void;
  /** Extra secondary reactions shown below SAME */
  secondaryReactions?: ReactionEntry[];
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000)   return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExperienceCard({
  id,
  body,
  categoryLabel,
  stateLabel,
  authorAlias,
  sameCount,
  hasReacted,
  hasSaved,
  publishedAt,
  onSame,
  onSave,
  secondaryReactions = [],
  className,
}: ExperienceCardProps) {
  return (
    <article
      aria-label={`Experience shared in ${categoryLabel}`}
      className={cn(
        'py-10 md:py-14 border-b border-[var(--color-border)]',
        className
      )}
    >
      {/* ─── Category + state badge (subtle metadata above body) ─── */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-[0.08em]">
          {categoryLabel}
        </span>
        {stateLabel && (
          <>
            <span aria-hidden="true" className="text-caption text-[var(--color-border-strong)]">·</span>
            <span className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
              {stateLabel}
            </span>
          </>
        )}
      </div>

      {/* ─── Body — the most prominent element on the page ─── */}
      <Link
        href={ROUTES.POST_DETAIL(id)}
        className="block group focus-visible:outline-none"
        aria-label="Read full experience"
      >
        <p
          className={cn(
            'font-editorial text-headline text-[var(--color-text)]',
            'max-w-reading',
            'text-pretty',
            'transition-opacity duration-[var(--duration-fast)]',
            'group-hover:opacity-90',
            'group-focus-visible:outline group-focus-visible:outline-2',
            'group-focus-visible:outline-[var(--color-accent)]',
            'group-focus-visible:outline-offset-4',
            'group-focus-visible:rounded-[var(--radius-sm)]',
          )}
        >
          {body}
        </p>
      </Link>

      {/* ─── Divider ─── */}
      <div className="mt-6 mb-4 border-t border-[var(--color-border)]" aria-hidden="true" />

      {/* ─── Reaction row ─── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* SAME button — the primary reaction */}
        <button
          type="button"
          aria-pressed={hasReacted}
          aria-label={
            hasReacted
              ? `You said SAME — ${sameCount} people`
              : `Say SAME — ${sameCount} people feel the same`
          }
          onClick={() => onSame?.(id, hasReacted)}
          className={cn(
            'reaction-btn text-ui font-medium min-h-[36px]',
            hasReacted && 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-subtle)]',
          )}
        >
          SAME
          <span
            aria-hidden="true"
            className="ml-0.5 text-caption font-normal tabular-nums"
          >
            {sameCount}
          </span>
        </button>

        {/* Secondary reactions */}
        {secondaryReactions.map((r) => (
          <span
            key={r.typeId}
            className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]"
          >
            {r.label}{' '}
            <span className="tabular-nums">({r.count})</span>
          </span>
        ))}

        {/* Save — ghost, right-side */}
        <button
          type="button"
          aria-pressed={hasSaved}
          aria-label={hasSaved ? 'Unsave this experience' : 'Save this experience'}
          onClick={() => onSave?.(id, hasSaved)}
          className="ml-auto text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-[var(--duration-fast)] min-h-[36px] px-1"
        >
          {hasSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* ─── Connect CTA ─── */}
      <div className="mt-5">
        <Link
          href={ROUTES.POST_DETAIL(id)}
          className={cn(
            'text-ui text-[var(--color-accent)]',
            'hover:opacity-80',
            'transition-opacity duration-[var(--duration-fast)]',
          )}
        >
          Talk to someone who&apos;s been through this →
        </Link>
      </div>

      {/* ─── Author alias — smallest text on the card ─── */}
      <p className="mt-6 text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
        Shared by {authorAlias.name} · {timeAgo(publishedAt)}
      </p>
    </article>
  );
}

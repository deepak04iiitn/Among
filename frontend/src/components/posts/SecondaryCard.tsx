import * as React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';

/**
 * Secondary Discovery Card — one of up to 5 beneath the primary experience.
 *
 * Design (CLAUDE.md §7.3 + Plan §7B.6):
 *  - 2px left border. On hover: `border-accent`.
 *  - The border HEIGHT is proportional to the SAME count — a visual resonance
 *    meter. Implemented via a positioned inner bar that grows logarithmically.
 *    Formula: `clamp(24px, log(sameCount + 1) * 16px, 100%)`.
 *  - Body: `line-clamp-2`, `text-body text-text`.
 *  - Metadata below body: category + SAME count — muted, caption.
 *  - No reaction bar. No author alias. Entire card is a link.
 */

export interface SecondaryCardProps {
  id:            string;
  body:          string;
  categoryLabel: string;
  sameCount:     number;
  publishedAt:   string;
  className?:    string;
}

export default function SecondaryCard({
  id,
  body,
  categoryLabel,
  sameCount,
  className,
}: SecondaryCardProps) {
  // Logarithmic resonance height — grows with sameCount without monopolising
  const resonancePct = Math.min(
    100,
    Math.max(12, Math.log(sameCount + 1) * 18)
  );

  return (
    <Link
      href={ROUTES.POST_DETAIL(id)}
      aria-label={`${body.slice(0, 80)}… — ${sameCount} SAME`}
      className={cn(
        'group relative flex gap-0 py-5',
        'border-b border-[var(--color-border)]',
        'transition-colors duration-[var(--duration-fast)]',
        'focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-[var(--color-accent)]',
        'focus-visible:outline-offset-2',
        'focus-visible:rounded-[var(--radius-sm)]',
        className
      )}
    >
      {/* ─── Resonance bar (left border) ─── */}
      <div
        aria-hidden="true"
        className="relative w-0.5 mr-5 flex-shrink-0 self-stretch bg-[var(--color-border)] rounded-full overflow-hidden"
      >
        {/* Inner bar grows proportionally */}
        <div
          className={cn(
            'absolute top-0 left-0 w-full',
            'rounded-full',
            'bg-[var(--color-border-strong)]',
            'transition-colors duration-[var(--duration-fast)]',
            'group-hover:bg-[var(--color-accent)]',
          )}
          style={{ height: `${resonancePct}%` }}
        />
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-body text-[var(--color-text)]',
          'line-clamp-2',
          'mb-2',
          'group-hover:opacity-90',
          'transition-opacity duration-[var(--duration-fast)]',
        )}>
          {body}
        </p>
        <p className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
          {categoryLabel}
          {sameCount > 0 && (
            <>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="tabular-nums">{sameCount} SAME</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

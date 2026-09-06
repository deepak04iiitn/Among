import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * AMONG Skeleton — content-matched placeholder.
 *
 * Uses `bg-border` (not a generic gray) so it reads as a real placeholder
 * that belongs in the layout. Color matches the divider/border color.
 * Gentle `animate-[skeleton]` pulse — not an aggressive loading shimmer.
 *
 * Used as a layout primitive — combine to create content-shaped skeletons
 * that match the structure of the actual content they replace.
 *
 * Rule: LoadingSpinner is ONLY for action-in-progress (submitting a post,
 * sending a message). Skeleton is for page-level/feed-level loading.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset shapes — override className for custom shapes */
  shape?: 'text' | 'circle' | 'rect';
}

export function Skeleton({ shape = 'text', className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        // Base skeleton
        'bg-[var(--color-border)] animate-[skeletonPulse_1.6s_ease-in-out_infinite]',

        // Shape presets
        shape === 'text'   && 'h-4 rounded-[var(--radius-sm)] w-full',
        shape === 'circle' && 'rounded-full',
        shape === 'rect'   && 'rounded-[var(--radius-sm)]',

        className
      )}
      {...props}
    />
  );
}

/** Skeleton block for the primary editorial experience card */
export function SkeletonExperienceCard() {
  return (
    <div
      role="status"
      aria-label="Loading experience"
      className="py-8 border-b border-[var(--color-border)]"
    >
      {/* Headline — editorial scale */}
      <Skeleton className="h-10 w-4/5 mb-4" />
      <Skeleton className="h-10 w-3/4 mb-4" />
      <Skeleton className="h-10 w-2/3 mb-8" />

      {/* Body lines */}
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-5/6 mb-8" />

      {/* Reaction row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20 rounded-[var(--radius-pill)]" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Alias — smallest, at the bottom */}
      <Skeleton className="h-3 w-40 mt-6" />
      <span className="sr-only">Loading experience…</span>
    </div>
  );
}

/** Skeleton block for a secondary discovery card */
export function SkeletonSecondaryCard() {
  return (
    <div
      role="status"
      aria-label="Loading post"
      className="flex gap-4 py-5 border-b border-[var(--color-border)]"
    >
      {/* Left resonance bar */}
      <div className="w-0.5 self-stretch bg-[var(--color-border)] rounded-full flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-3" />
        <Skeleton className="h-3 w-32" />
      </div>
      <span className="sr-only">Loading post…</span>
    </div>
  );
}

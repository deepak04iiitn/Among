'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * CrisisResourceBanner — appears immediately when crisis patterns are detected.
 *
 * NEVER delayed, batched, or suppressed.
 * NEVER styled as an error. Warm, supportive tone — not an alert.
 * `aria-live="assertive"` — announced immediately by screen readers.
 * Cannot be dismissed until visible for at least 3 seconds (CLAUDE.md §9).
 *
 * Crisis detection fires:
 *  - In compose (before submit) if body text matches crisis patterns
 *  - In message composer (on each message)
 *  - On post publish response (crisisDetected: true from API)
 *
 * Resources are dynamic — passed as props from `crisisResources` constants.
 */

export interface CrisisResource {
  readonly name:        string;
  readonly description: string;
  readonly phone?:      string;
  readonly url?:        string;
  readonly available:   string;   // e.g. "24/7", "Mon–Fri 9am–9pm"
}

export interface CrisisResourceBannerProps {
  resources:  CrisisResource[];
  onDismiss?: () => void;
  className?: string;
}

const MIN_VISIBLE_MS = 3000;

export default function CrisisResourceBanner({
  resources,
  onDismiss,
  className,
}: CrisisResourceBannerProps) {
  const [canDismiss, setCanDismiss] = React.useState(false);
  const mountedAt = React.useRef(Date.now());

  // Enforce minimum visibility of 3 seconds before dismiss is enabled
  React.useEffect(() => {
    mountedAt.current = Date.now();
    const timer = setTimeout(() => setCanDismiss(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (!canDismiss) return;
    onDismiss?.();
  };

  return (
    <div
      role="complementary"
      aria-live="assertive"
      aria-atomic="true"
      aria-label="Support resources available"
      className={cn(
        'relative',
        'border border-[var(--color-border)]',
        'bg-[var(--color-bg)]',
        'rounded-[var(--radius-lg)]',
        'p-5 md:p-6',
        'animate-[slideUp_250ms_var(--ease-out)_both]',
        className
      )}
    >
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-ui font-medium text-[var(--color-text)]">
            You don&apos;t have to go through this alone.
          </p>
          <p className="mt-1 text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
            These resources are here for you, whenever you&apos;re ready.
          </p>
        </div>

        {/* Dismiss — only active after MIN_VISIBLE_MS */}
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={
              canDismiss
                ? 'Dismiss support resources'
                : 'Please take a moment to read these resources'
            }
            aria-disabled={!canDismiss}
            className={cn(
              'p-1.5 -mr-1 -mt-1 flex-shrink-0 ml-4',
              'text-[var(--color-text-muted)]',
              'rounded-[var(--radius-sm)]',
              'transition-all duration-[var(--duration-fast)]',
              'focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-[var(--color-accent)]',
              canDismiss
                ? 'hover:text-[var(--color-text)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed',
            )}
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ─── Resources list ─── */}
      <ul className="space-y-3" aria-label="Crisis support resources">
        {resources.map((resource) => (
          <li
            key={resource.name}
            className="flex flex-col gap-0.5"
          >
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-ui font-medium text-[var(--color-text)]">
                {resource.name}
              </span>
              {resource.phone && (
                <a
                  href={`tel:${resource.phone.replace(/\D/g, '')}`}
                  className={cn(
                    'text-ui text-[var(--color-accent)]',
                    'hover:opacity-80 transition-opacity',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-[var(--color-accent)]',
                  )}
                  aria-label={`Call ${resource.name}: ${resource.phone}`}
                >
                  {resource.phone}
                </a>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-caption text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-accent)] transition-colors',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-[var(--color-accent)]',
                  )}
                  aria-label={`Visit ${resource.name} website (opens in new tab)`}
                >
                  Visit website ↗
                </a>
              )}
            </div>
            <p className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)]">
              {resource.description} · {resource.available}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

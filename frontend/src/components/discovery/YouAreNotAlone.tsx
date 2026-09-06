/**
 * YouAreNotAlone.tsx — Aggregate experience stats for the user.
 *
 * PRD §6.2 Privacy:
 *  - Groups below PRIVACY_THRESHOLD_MIN_GROUP_SIZE show "Not enough data" (masked).
 *  - Individual user data is NEVER shown here.
 *
 * Design:
 *  - Typographic only — no progress bars, badges, or gamification.
 *  - The emotional weight is in the copy, not the visuals.
 *  - Uses PrivacySafeCount for all counts.
 */
import * as React from 'react';
import type { YanaStatEntry } from '../../lib/discoveryApi';
import { PrivacySafeCount } from '../reactions/PrivacySafeCount';
import { PRIVACY_THRESHOLD_MIN_GROUP_SIZE } from '../../constants/limits';

export interface YouAreNotAloneProps {
  entries:  YanaStatEntry[];
  loading?: boolean;
}

export function YouAreNotAlone({ entries, loading = false }: YouAreNotAloneProps) {
  if (loading) {
    return (
      <section aria-label="You Are Not Alone" aria-busy="true" className="space-y-6">
        <p className="font-editorial text-title text-[var(--color-text)]">
          You Are Not Alone
        </p>
        <p className="text-body text-[var(--color-text-muted)] italic">
          Loading…
        </p>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section aria-label="You Are Not Alone" className="space-y-4">
        <p className="font-editorial text-title text-[var(--color-text)]">
          You Are Not Alone
        </p>
        <p className="text-body text-[var(--color-text-muted)] italic">
          Come back tomorrow — the pool refreshes.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="You Are Not Alone" className="space-y-6">
      <h2 className="font-editorial text-title text-[var(--color-text)]">
        You Are Not Alone
      </h2>

      <p className="text-body text-[var(--color-text-muted)]">
        Others who shared a similar experience this week.
      </p>

      <ul className="space-y-4" aria-label="Experience area stats">
        {entries.map((entry) => (
          <li
            key={entry.categoryId}
            className="flex items-baseline gap-3"
          >
            <span className="text-body text-[var(--color-text)]">
              {entry.displayName}
            </span>

            {entry.belowThreshold ? (
              <span
                className="text-caption text-[var(--color-text-muted)]"
                aria-label={`Fewer than ${PRIVACY_THRESHOLD_MIN_GROUP_SIZE} people — not enough data to show`}
              >
                Not enough data yet
              </span>
            ) : (
              <span className="text-caption text-[var(--color-text-muted)]">
                <PrivacySafeCount
                  count={entry.count!}
                  label={`people shared in ${entry.displayName} this week`}
                  className="font-medium text-[var(--color-text)]"
                />
                {' '}this week
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

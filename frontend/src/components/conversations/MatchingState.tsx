/**
 * MatchingState.tsx — Shown while waiting for a match or when no match is found.
 *
 * Design: quiet, intimate typography. No animations. No countdown pressure.
 */
'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import {
  selectMatchingState,
  selectMatchingRequestId,
} from '../../features/conversations/conversationsSlice';
import {
  cancelMatchRequestThunk,
} from '../../features/conversations/conversationsThunks';
import { ROUTES } from '../../constants/routes';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchingStateProps {
  onMatchFound?: (conversationId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MatchingState({ onMatchFound }: MatchingStateProps): React.JSX.Element {
  const dispatch     = useDispatch<AppDispatch>();
  const matchState   = useSelector(selectMatchingState);
  const requestId    = useSelector(selectMatchingRequestId);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (matchState !== 'searching') {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [matchState]);

  const handleCancel = (): void => {
    if (requestId) {
      void dispatch(cancelMatchRequestThunk(requestId));
    }
  };

  // ── No match found ──────────────────────────────────────────────────────────
  if (matchState === 'no_match') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="font-editorial text-title text-[var(--color-text)] mb-3">
          No one was available right now.
        </p>
        <p className="text-body text-[var(--color-text-muted)] mb-8 max-w-sm">
          That&rsquo;s okay. You can browse the experiences below — many are waiting for someone like you.
        </p>
        <Link
          href={ROUTES.EXPLORE}
          className="inline-block px-6 py-3 rounded-full border border-[var(--color-border)] text-ui text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-150"
        >
          Browse experiences →
        </Link>
      </div>
    );
  }

  // ── Searching ───────────────────────────────────────────────────────────────
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const elapsed = minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, '0')}s`
    : `${seconds}s`;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      aria-live="polite"
      aria-label="Searching for a conversation match"
    >
      <p className="font-editorial text-title text-[var(--color-text)] mb-3">
        Looking for someone available…
      </p>
      <p className="text-body text-[var(--color-text-muted)] mb-2 max-w-sm">
        We&rsquo;ll connect you as soon as someone with a similar experience is ready to talk.
      </p>
      <p className="text-caption text-[var(--color-text-muted)] mb-10 tabular-nums">
        {elapsed}
      </p>

      <button
        onClick={handleCancel}
        className="text-ui text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text)] transition-colors duration-150"
        aria-label="Cancel match request"
      >
        Cancel
      </button>

      <p className="mt-8 text-caption text-[var(--color-text-muted)] italic">
        Searches expire after 15 minutes.
      </p>
    </div>
  );
}

/**
 * SkipControls.tsx — Skip flow for the SNY prompt.
 *
 * Shows "See another" until daily skip limit is reached.
 * When limit is reached, shows a "No more for today" message.
 */
'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { skipPromptThunk, dismissPromptThunk } from '../../features/someoneNeedsYou/snyThunks';
import { selectSNYStatus } from '../../features/someoneNeedsYou/snySlice';
import { useSelector } from 'react-redux';
import { DAILY_SNY_SKIP_LIMIT } from '../../constants/limits';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SkipControlsProps {
  /** The postId of the currently shown prompt */
  currentPostId: string;
  /** How many skips the user has already used */
  skipsUsed: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkipControls({
  currentPostId,
  skipsUsed,
}: SkipControlsProps): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const status   = useSelector(selectSNYStatus);
  const isLoading = status === 'loading';

  const skipsRemaining = Math.max(0, DAILY_SNY_SKIP_LIMIT - skipsUsed);
  const atLimit = skipsRemaining === 0;

  function handleSkip(): void {
    void dispatch(skipPromptThunk(currentPostId));
  }

  function handleDismiss(): void {
    void dispatch(dismissPromptThunk());
  }

  return (
    <div className="flex items-center gap-3">
      {atLimit ? (
        <p className="text-sm text-neutral-400 italic">
          No more suggestions for today.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleSkip}
          disabled={isLoading}
          className="
            inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500
            hover:text-neutral-700 transition-colors duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
          "
          aria-label="See another experience"
        >
          See another
          {skipsUsed > 0 && (
            <span
              className="text-xs text-neutral-400"
              aria-label={`${skipsUsed} of ${DAILY_SNY_SKIP_LIMIT} skips used`}
            >
              ({skipsUsed}/{DAILY_SNY_SKIP_LIMIT})
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={handleDismiss}
        disabled={isLoading}
        className="
          text-sm text-neutral-400 hover:text-neutral-600
          transition-colors duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        aria-label="Dismiss for today"
      >
        Not today
      </button>
    </div>
  );
}

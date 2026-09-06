/**
 * PromptCard.tsx — "Someone Needs You" daily prompt card.
 *
 * Design principles (PRD §UI):
 *  - The matched post is anonymized — original author alias is NEVER shown here.
 *  - Shows only the experience context (category + body preview).
 *  - Accept → conversation request flow.
 *  - Skip → SkipControls handles rotation.
 *  - Dismiss → day dismissed, card disappears.
 *
 * Feature-gated: rendered only when `someoneNeedsYou` flag is enabled.
 */
'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import {
  selectSNYPrompt,
  selectSNYStatus,
  selectAcceptedContext,
  acceptedContextCleared,
} from '../../features/someoneNeedsYou/snySlice';
import {
  fetchDailyPromptThunk,
  acceptPromptThunk,
} from '../../features/someoneNeedsYou/snyThunks';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import SkipControls from './SkipControls';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PromptCardProps {
  /** Called after accept with the context for creating a conversation */
  onAccepted?: (contextCategoryId: string, contextPostId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromptCard({ onAccepted }: PromptCardProps): React.JSX.Element | null {
  const dispatch       = useDispatch<AppDispatch>();
  const isEnabled      = useFeatureFlag('someoneNeedsYou');
  const prompt         = useSelector(selectSNYPrompt);
  const status         = useSelector(selectSNYStatus);
  const acceptedCtx    = useSelector(selectAcceptedContext);
  const isLoading      = status === 'loading';

  // Load the prompt on mount if feature is enabled
  useEffect(() => {
    if (isEnabled) {
      void dispatch(fetchDailyPromptThunk());
    }
  }, [dispatch, isEnabled]);

  // Fire callback when a prompt has been accepted
  useEffect(() => {
    if (acceptedCtx && onAccepted) {
      onAccepted(acceptedCtx.contextCategoryId, acceptedCtx.contextPostId);
      dispatch(acceptedContextCleared());
    }
  }, [acceptedCtx, onAccepted, dispatch]);

  // Feature is off — render nothing
  if (!isEnabled) return null;

  // Still loading or no prompt available
  if (status === 'idle' || status === 'loading' || !prompt) return null;

  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === prompt.categoryId);
  const categoryName = category?.displayName ?? prompt.categoryId;

  function handleAccept(): void {
    if (!prompt) return;
    void dispatch(acceptPromptThunk(prompt.postId));
  }

  return (
    <article
      className="
        group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white
        shadow-sm hover:shadow-md transition-shadow duration-300
        p-6 md:p-8
      "
      aria-label="Someone needs you today"
      role="region"
    >
      {/* Category badge */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="
            inline-block rounded-full bg-indigo-50 px-3 py-0.5
            text-xs font-semibold uppercase tracking-wider text-indigo-600
          "
        >
          {categoryName}
        </span>
        <span className="text-xs text-neutral-400">Someone is going through this now</span>
      </div>

      {/* Headline */}
      <h2 className="mb-1 font-editorial text-title-xl text-neutral-900 leading-tight">
        Someone needs you today.
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        You've been through something similar. Would you like to connect?
      </p>

      {/* Anonymized body preview */}
      <blockquote
        className="
          mb-6 border-l-2 border-indigo-200 pl-4
          text-base text-neutral-700 leading-relaxed italic
          line-clamp-4
        "
        aria-label="Experience excerpt"
      >
        {prompt.bodyPreview}
        {prompt.bodyPreview.length >= 280 && (
          <span className="not-italic text-neutral-400"> …</span>
        )}
      </blockquote>

      {/* Privacy note */}
      <p className="mb-5 text-xs text-neutral-400">
        Conversations are anonymous, temporary, and never stored long-term.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isLoading}
          className="
            inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5
            text-sm font-semibold text-white shadow-sm
            hover:bg-indigo-700 active:scale-[0.98]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="Connect with this person"
        >
          {isLoading ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Connecting…
            </>
          ) : (
            'I want to help'
          )}
        </button>

        <SkipControls
          currentPostId={prompt.postId}
          skipsUsed={prompt.skipsUsed}
        />
      </div>
    </article>
  );
}

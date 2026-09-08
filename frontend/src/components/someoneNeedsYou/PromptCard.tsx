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
      className="group relative rounded-lg border border-border p-6 md:p-8"
      aria-label="Someone needs you today"
      role="region"
    >
      {/* Category — typographic only, no color fill */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-caption text-text-muted">
          {categoryName}
        </span>
        <span className="text-caption text-text-muted">Someone is going through this now</span>
      </div>

      {/* Headline */}
      <h2 className="mb-1 font-editorial text-title-xl text-text leading-tight">
        Someone needs you today.
      </h2>
      <p className="mb-4 text-ui text-text-secondary">
        You've been through something similar. Would you like to connect?
      </p>

      {/* Anonymized body preview */}
      <blockquote
        className="
          mb-6 border-l-2 border-border pl-4
          text-body text-text leading-relaxed italic
          line-clamp-4
        "
        aria-label="Experience excerpt"
      >
        {prompt.bodyPreview}
        {prompt.bodyPreview.length >= 280 && (
          <span className="not-italic text-text-muted"> …</span>
        )}
      </blockquote>

      {/* Privacy note */}
      <p className="mb-5 text-caption text-text-muted">
        Conversations are anonymous, temporary, and never stored long-term.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isLoading}
          className="btn-primary"
          aria-label="Connect with this person"
        >
          {isLoading ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-bg)] border-t-transparent"
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

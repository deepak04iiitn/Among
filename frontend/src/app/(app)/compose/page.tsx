/**
 * compose/page.tsx — The compose route.
 *
 * Wires ComposeForm to the Redux createPostThunk.
 * After successful submission, navigates to the home feed.
 *
 * Design: single-column editorial. No chrome — the empty page IS the prompt.
 * Protected by AuthGuard (in the (app) layout).
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../store';
import { createPostThunk } from '../../../features/posts/postsThunks';
import { selectSubmitting, selectComposeError } from '../../../features/posts/postsSlice';
import { ComposeForm, type ComposeFormValues } from '../../../components/compose/ComposeForm';
import { ROUTES } from '../../../constants/routes';
import type { PostExperienceState } from '../../../constants/postStates';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ComposePage() {
  const router     = useRouter();
  const dispatch   = useAppDispatch();
  const submitting = useAppSelector(selectSubmitting);
  const error      = useAppSelector(selectComposeError);

  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(values: ComposeFormValues) {
    const resultAction = await dispatch(
      createPostThunk({
        body:            values.body,
        categoryIds:     values.categoryIds,
        state:           values.state as PostExperienceState,
        visibilityScope: values.visibilityScope,
      })
    );

    if (createPostThunk.fulfilled.match(resultAction)) {
      setSubmitted(true);
      // Navigate to home after a brief acknowledgement moment
      setTimeout(() => router.push(ROUTES.HOME), 800);
    }
  }

  // ─── Post-submit confirmation screen ─────────────────────────────────────
  if (submitted) {
    return (
      <div className="content-column py-16 text-center">
        <p className="font-editorial text-headline text-[var(--color-text)] text-balance">
          Shared.
        </p>
        <p className="mt-3 text-body text-[var(--color-text-secondary)]">
          Your experience is now part of AMONG.
        </p>
      </div>
    );
  }

  return (
    <div className="content-column py-8 md:py-12">
      {/* Accessible H1 — screen readers announce the page purpose */}
      <h1 className="sr-only">Share an experience</h1>

      <ComposeForm
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../constants/routes';
import { POST_MIN_CHARS, POST_MAX_CHARS } from '../../../constants/limits';
import ComposeArea from '../../../components/compose/ComposeArea';
import CategorySelector from '../../../components/compose/CategorySelector';
import StateSelector, { type ExperienceState } from '../../../components/compose/StateSelector';
import { Button } from '../../../components/ui/button';

/**
 * Compose page — the notebook.
 *
 * Design (Plan §7B.6 — Compose Page):
 *  - Borderless text area on white — feels like a blank notebook page.
 *  - Text renders in `font-editorial text-body-lg` as user types.
 *  - Category chips below (typographic pill, no color fill).
 *  - State selector (Current / Past / Exploratory) — segmented pill.
 *  - Submit: "Share anonymously" — full-width inverted pill.
 *  - No modal safety reminders — marginal note only (inside ComposeArea).
 *
 * Note: Actual API submission wired in Phase 4. This component handles
 * all the UI state and form validation.
 */

// Metadata cannot be in a 'use client' file — it's hoisted here as a comment.
// The actual metadata export is in a server wrapper if needed. For now the
// robots disallow covers this via robots.ts.

export default function ComposePage() {
  const router = useRouter();
  const [body,       setBody]       = React.useState('');
  const [categories, setCategories] = React.useState<string[]>([]);
  const [state,      setState]      = React.useState<ExperienceState>('current');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted,  setSubmitted]  = React.useState(false);

  const bodyLength  = body.trim().length;
  const canSubmit   =
    bodyLength >= POST_MIN_CHARS &&
    bodyLength <= POST_MAX_CHARS &&
    categories.length >= 1 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Phase 4: wire to API. For now simulate a brief delay.
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    // Phase 4: navigate to newly created post
    setTimeout(() => router.push(ROUTES.HOME), 400);
  };

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
      {/* Accessible H1 — screen readers announce the purpose */}
      <h1 className="sr-only">Share an experience</h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Share an experience"
        className="space-y-8"
      >
        {/* ─── Compose area — the blank notebook ─── */}
        <section aria-label="Write your experience">
          <ComposeArea
            value={body}
            onChange={setBody}
            autoFocus
          />
        </section>

        {/* ─── Divider ─── */}
        <div className="border-t border-[var(--color-border)]" aria-hidden="true" />

        {/* ─── Category selection ─── */}
        <section aria-labelledby="category-heading">
          <h2
            id="category-heading"
            className="text-ui font-medium text-[var(--color-text)] mb-3"
          >
            What is this about?
          </h2>
          <CategorySelector
            selectedIds={categories}
            onChange={setCategories}
          />
        </section>

        {/* ─── State selection ─── */}
        <section aria-labelledby="state-heading">
          <h2
            id="state-heading"
            className="text-ui font-medium text-[var(--color-text)] mb-3"
          >
            When is this?
          </h2>
          <StateSelector
            value={state}
            onChange={setState}
          />
        </section>

        {/* ─── Submit ─── */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!canSubmit}
            aria-label={submitting ? 'Sharing your experience…' : 'Share anonymously'}
          >
            {submitting ? 'Sharing…' : 'Share anonymously'}
          </Button>

          {/* Validation hint — only appears when form is incomplete */}
          {bodyLength > 0 && bodyLength < POST_MIN_CHARS && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-3 text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] text-center"
            >
              A little more — {POST_MIN_CHARS - bodyLength} characters to go.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

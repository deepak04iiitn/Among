/**
 * ComposeForm.tsx — The core "blank notebook page" compose experience.
 *
 * Design principles (PRD §7.3):
 *  - Borderless text area on white — feels like a blank notebook page.
 *  - Character count visible only when within COMPOSE_COUNTER_VISIBLE_THRESHOLD chars of limit.
 *  - Safety reminder shown once per session (via SafetyReminder + sessionStorage).
 *  - "Things I Can't Say" mode: category requirement drops to 0.
 *  - Submit disabled until form is valid (Zod schema enforced client-side).
 *
 * Note: this is a presentational component that accepts callbacks.
 * All API calls and Redux dispatch live in compose/page.tsx.
 */
'use client';

import * as React from 'react';
import ComposeArea from './ComposeArea';
import CategorySelector from './CategorySelector';
import StateSelector, { type ExperienceState } from './StateSelector';
import { SafetyReminder, hasSafetyReminderBeenSeen } from './SafetyReminder';
import { Button } from '../ui/button';
import {
  POST_MIN_CHARS,
  POST_MAX_CHARS,
  COMPOSE_COUNTER_VISIBLE_THRESHOLD,
} from '../../constants/limits';
import type { PostVisibility } from '../../constants/postStates';
import { POST_VISIBILITY } from '../../constants/postStates';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ComposeFormValues {
  body:            string;
  categoryIds:     string[];
  state:           ExperienceState;
  visibilityScope: PostVisibility;
}

export interface ComposeFormProps {
  /** Called when user confirms the safety reminder and submits */
  onSubmit: (values: ComposeFormValues) => void;
  /** External submitting flag from parent (Redux in-flight) */
  submitting?: boolean;
  /** External error to display below the form */
  error?: string | null;
}

// ─── Visibility options ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: Array<{ value: PostVisibility; label: string; description: string }> = [
  { value: POST_VISIBILITY.BROAD,   label: 'Everyone',     description: 'Shown in the main pool' },
  { value: POST_VISIBILITY.FOCUSED, label: 'Category',     description: 'Only within this category' },
  { value: POST_VISIBILITY.PRIVATE, label: 'Not shared',   description: 'Saved but not visible to others' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ComposeForm({ onSubmit, submitting = false, error = null }: ComposeFormProps) {
  const [body,            setBody]            = React.useState('');
  const [categoryIds,     setCategoryIds]     = React.useState<string[]>([]);
  const [state,           setState]           = React.useState<ExperienceState>('current');
  const [visibilityScope, setVisibilityScope] = React.useState<PostVisibility>(POST_VISIBILITY.BROAD);
  const [showReminder,    setShowReminder]    = React.useState(false);

  // "Things I Can't Say" mode: a post with state='exploratory' and no categories
  const isThingsICantSay = state === 'exploratory' && categoryIds.length === 0;
  const categoryMin       = isThingsICantSay ? 0 : 1;

  const bodyLength     = body.trim().length;
  const charsRemaining = POST_MAX_CHARS - bodyLength;
  const showCounter    = charsRemaining <= COMPOSE_COUNTER_VISIBLE_THRESHOLD;

  const isValid =
    bodyLength >= POST_MIN_CHARS &&
    bodyLength <= POST_MAX_CHARS &&
    categoryIds.length >= categoryMin;

  // ─── Submit flow ──────────────────────────────────────────────────────────

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    // Safety reminder gate — first session submit only
    if (!hasSafetyReminderBeenSeen()) {
      setShowReminder(true);
      return;
    }

    onSubmit({ body: body.trim(), categoryIds, state, visibilityScope });
  }

  function handleReminderConfirm() {
    setShowReminder(false);
    onSubmit({ body: body.trim(), categoryIds, state, visibilityScope });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showReminder && (
        <SafetyReminder
          onConfirm={handleReminderConfirm}
          onDismiss={() => setShowReminder(false)}
        />
      )}

      <form
        onSubmit={handleFormSubmit}
        noValidate
        aria-label="Share an experience"
        className="space-y-8"
      >
        {/* ─── Main compose area ─────────────────────────────────────────── */}
        <section aria-label="Write your experience">
          <ComposeArea
            value={body}
            onChange={setBody}
            autoFocus
          />

          {/* Character counter — appears only near the limit */}
          {showCounter && (
            <p
              className={`mt-2 text-right text-caption transition-colors ${
                charsRemaining < 0
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
              aria-live="polite"
              aria-label={`${charsRemaining} characters remaining`}
            >
              {charsRemaining}
            </p>
          )}
        </section>

        <div className="border-t border-[var(--color-border)]" aria-hidden="true" />

        {/* ─── Category selection ──────────────────────────────────────── */}
        <section aria-labelledby="category-heading">
          <h2
            id="category-heading"
            className="text-ui font-medium text-[var(--color-text)] mb-3"
          >
            What is this about?
          </h2>
          <CategorySelector
            selectedIds={categoryIds}
            onChange={setCategoryIds}
          />
          {/* "Things I Can't Say" hint */}
          {state === 'exploratory' && (
            <p className="mt-3 text-caption italic text-[var(--color-text-muted)]">
              In Exploratory mode, categories are optional — your experience stands on its own.
            </p>
          )}
        </section>

        {/* ─── State selection ─────────────────────────────────────────── */}
        <section aria-labelledby="state-heading">
          <h2
            id="state-heading"
            className="text-ui font-medium text-[var(--color-text)] mb-3"
          >
            When is this?
          </h2>
          <StateSelector value={state} onChange={setState} />
        </section>

        {/* ─── Visibility scope ────────────────────────────────────────── */}
        <section aria-labelledby="visibility-heading">
          <h2
            id="visibility-heading"
            className="text-ui font-medium text-[var(--color-text)] mb-3"
          >
            Who can see this?
          </h2>
          <div className="flex gap-3 flex-wrap" role="radiogroup" aria-labelledby="visibility-heading">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={visibilityScope === opt.value}
                onClick={() => setVisibilityScope(opt.value)}
                className={`
                  px-4 py-2 text-ui border transition-colors
                  ${
                    visibilityScope === opt.value
                      ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Describe the selected option */}
          <p className="mt-2 text-caption text-[var(--color-text-muted)]">
            {VISIBILITY_OPTIONS.find((o) => o.value === visibilityScope)?.description}
          </p>
        </section>

        {/* ─── Error ───────────────────────────────────────────────────── */}
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-caption text-[var(--color-error)]"
          >
            {error}
          </p>
        )}

        {/* ─── Submit ──────────────────────────────────────────────────── */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!isValid || submitting}
            aria-label={submitting ? 'Sharing your experience…' : 'Share anonymously'}
          >
            {submitting ? 'Sharing…' : 'Share anonymously'}
          </Button>

          {/* Min-length hint */}
          {bodyLength > 0 && bodyLength < POST_MIN_CHARS && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-caption text-[var(--color-text-muted)] text-center"
            >
              {POST_MIN_CHARS - bodyLength} more characters to go.
            </p>
          )}
        </div>
      </form>
    </>
  );
}

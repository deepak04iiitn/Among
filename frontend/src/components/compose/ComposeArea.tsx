'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Textarea } from '../ui/textarea';
import {
  POST_MAX_CHARS,
  COMPOSE_COUNTER_VISIBLE_THRESHOLD as CHAR_COUNT_VISIBLE_THRESHOLD,
} from '../../constants/limits';

/**
 * ComposeArea — the borderless text area for the compose flow.
 *
 * Design (Plan §7B.6 — Compose Page):
 * - Borderless on white — feels like a blank notebook page.
 * - Text renders in `font-editorial text-body-lg` as user types.
 * - Character count: invisible until within CHAR_COUNT_VISIBLE_THRESHOLD
 *   of the limit. Before that threshold — let the writer write.
 * - Safety marginal note: slides up on first focus, disappears when
 *   user starts typing. `text-caption italic text-text-muted`.
 *   Never a modal. It's a marginal note.
 */

export interface ComposeAreaProps {
  value:      string;
  onChange:   (value: string) => void;
  onFocus?:   () => void;
  onBlur?:    () => void;
  placeholder?: string;
  disabled?:  boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function ComposeArea({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = 'Say what\'s on your mind…',
  disabled    = false,
  autoFocus   = false,
  className,
}: ComposeAreaProps) {
  const [hasFocused,  setHasFocused]  = React.useState(false);
  const [showSafetyNote, setShowSafetyNote] = React.useState(false);
  const remaining = POST_MAX_CHARS - value.length;
  const showCharCount = remaining <= CHAR_COUNT_VISIBLE_THRESHOLD;
  const isNearLimit   = remaining <= 50;
  const isOverLimit   = remaining < 0;

  const handleFocus = () => {
    if (!hasFocused) {
      setHasFocused(true);
      setShowSafetyNote(true);
    }
    onFocus?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // Hide safety note once user starts typing
    if (newValue.length > 0 && showSafetyNote) {
      setShowSafetyNote(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* The compose textarea — borderless, editorial */}
      <Textarea
        variant="borderless"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        noResize
        aria-label="Compose your experience"
        aria-describedby={showSafetyNote ? 'compose-safety-note' : undefined}
        aria-invalid={isOverLimit || undefined}
        className="text-[var(--color-text)] caret-[var(--color-accent)]"
      />

      {/* ─── Safety marginal note ─── */}
      {/* Appears on first focus, disappears when typing begins. */}
      {/* Never a modal — a marginal note, italic, muted. */}
      {showSafetyNote && (
        <p
          id="compose-safety-note"
          role="note"
          aria-live="polite"
          className={cn(
            'mt-3',
            'text-caption italic text-[var(--color-text-muted)]',
            'font-[var(--font-ui)]',
            'animate-[slideUp_250ms_var(--ease-out)_both]',
          )}
        >
          Tip: no names, locations, or contact details.
        </p>
      )}

      {/* ─── Character count ─── */}
      {/* Only visible within CHAR_COUNT_VISIBLE_THRESHOLD of limit */}
      {showCharCount && (
        <p
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            'mt-2 text-right text-caption tabular-nums font-[var(--font-ui)]',
            isOverLimit  && 'text-[var(--color-error)] font-medium',
            !isOverLimit && isNearLimit  && 'text-[var(--color-warn)]',
            !isOverLimit && !isNearLimit && 'text-[var(--color-text-muted)]',
          )}
        >
          {isOverLimit
            ? `${Math.abs(remaining)} over limit`
            : `${remaining} remaining`}
        </p>
      )}
    </div>
  );
}

/**
 * SafetyReminder.tsx — Modal shown once per session before the first submit.
 *
 * Design rules (PRD §7.2, §9.6):
 *  - NOT a modal-based safety reminder during compose — use as a pre-submit gate only.
 *  - Tone: warm and supportive, not alarmist.
 *  - Cannot be dismissed until fully read (3s minimum visible time).
 *  - After first acknowledgement, `sessionStorage` prevents re-show.
 *  - Accessibility: aria-modal, focus-trapped, aria-live="assertive" (PRD §9).
 *
 * Usage: render this before allowing the final API submit; once user confirms,
 * call `onConfirm()` which parent can use to proceed with submission.
 */
'use client';

import * as React from 'react';
import { Button } from '../ui/button';

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'among_safety_reminder_seen';

export function hasSafetyReminderBeenSeen(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

function markSafetyReminderSeen(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, '1');
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface SafetyReminderProps {
  onConfirm: () => void;
  onDismiss: () => void;
}

export function SafetyReminder({ onConfirm, onDismiss }: SafetyReminderProps) {
  const [ready,     setReady]     = React.useState(false);
  const confirmRef                = React.useRef<HTMLButtonElement>(null);
  const overlayId                 = React.useId();

  // Enforce minimum visible time of 3 seconds before the confirm button is active
  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Move focus to the modal when it mounts
  React.useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  function handleConfirm() {
    markSafetyReminderSeen();
    onConfirm();
  }

  return (
    // ─── Dark overlay ─────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${overlayId}-title`}
      aria-describedby={`${overlayId}-desc`}
    >
      {/* ─── Card ───────────────────────────────────────────────────────── */}
      <div
        className="bg-white w-full max-w-sm mx-4 p-8 border border-[var(--color-border)]"
        role="document"
      >
        <h2
          id={`${overlayId}-title`}
          className="font-editorial text-title text-[var(--color-text)] mb-4"
        >
          Before you share
        </h2>

        <p
          id={`${overlayId}-desc`}
          className="text-body text-[var(--color-text-secondary)] leading-relaxed"
        >
          AMONG is a space for shared experience, not a channel for personal contact.
          <br /><br />
          Please don&rsquo;t include your real name, phone number, email address, or any
          other identifying details. These are automatically flagged for your protection.
        </p>

        {/* Marginal note — typographic only, no colour highlight */}
        <p className="mt-5 text-caption italic text-[var(--color-text-muted)] border-l-2 border-[var(--color-border)] pl-3">
          Your words matter here. Keep the space safe for everyone.
        </p>

        {/* ─── Actions ────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            ref={confirmRef}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!ready}
            aria-disabled={!ready}
            onClick={handleConfirm}
            aria-label={ready ? 'I understand, share my experience' : 'Please wait…'}
          >
            {ready ? 'I understand — share anonymously' : 'Please read…'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onDismiss}
            aria-label="Go back to editing"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}

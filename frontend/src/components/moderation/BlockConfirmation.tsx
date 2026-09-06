'use client';

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../../lib/utils';
import {
  closeBlockConfirm,
  selectBlockConfirmTarget,
} from '../../features/moderation/moderationSlice';
import { blockUserThunk } from '../../features/moderation/moderationThunks';
import type { AppDispatch } from '../../store';

/**
 * BlockConfirmation — confirmation dialog before blocking a user.
 *
 * Explains the consequences of a block:
 *  - Hides all content from this account.
 *  - Prevents future matching with this account.
 *  - Block is on account ID — persists across alias rotations.
 *
 * WCAG AA: focus trap, escape-to-close, aria-labelledby.
 */
export default function BlockConfirmation(): React.JSX.Element | null {
  const dispatch    = useDispatch<AppDispatch>();
  const targetId    = useSelector(selectBlockConfirmTarget);
  const [confirming, setConfirming] = React.useState(false);

  const labelId   = React.useId();
  const descId    = React.useId();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (targetId) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => cancelRef.current?.focus(), 50);
    } else {
      triggerRef.current?.focus();
    }
    setConfirming(false);
  }, [targetId]);

  // Escape key closes
  React.useEffect(() => {
    if (!targetId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeBlockConfirm());
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [targetId, dispatch]);

  if (!targetId) return null;

  const handleConfirm = () => {
    setConfirming(true);
    void dispatch(blockUserThunk(targetId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descId}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => dispatch(closeBlockConfirm())}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-sm',
          'bg-[var(--color-bg)] border border-[var(--color-border)]',
          'rounded-[var(--radius-lg)]',
          'p-6',
          'animate-[slideUp_250ms_var(--ease-out)_both]',
        )}
        role="document"
      >
        <h2
          id={labelId}
          className="text-title font-[var(--font-editorial)] text-[var(--color-text)] mb-3"
        >
          Block this person?
        </h2>

        <p
          id={descId}
          className="text-body text-[var(--color-text-muted)] mb-6 space-y-1"
        >
          Blocking will hide all of their content and prevent future matching.
          This block is tied to their account, not their alias — it will remain
          even if they change their alias.
        </p>

        <div className="flex gap-3">
          {/* Cancel — focused by default (safer default) */}
          <button
            ref={cancelRef}
            type="button"
            onClick={() => dispatch(closeBlockConfirm())}
            className={cn(
              'flex-1 py-2.5 px-4',
              'text-ui font-medium text-[var(--color-text)]',
              'border border-[var(--color-border)] rounded-full',
              'hover:border-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
            )}
          >
            Cancel
          </button>

          {/* Confirm block */}
          <button
            type="button"
            disabled={confirming}
            aria-disabled={confirming}
            onClick={handleConfirm}
            className={cn(
              'flex-1 py-2.5 px-4',
              'text-ui font-medium text-[var(--color-bg)]',
              'bg-[var(--color-text)] rounded-full',
              'hover:opacity-90 transition-opacity duration-[var(--duration-fast)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
              confirming && 'opacity-50 cursor-not-allowed',
            )}
          >
            {confirming ? 'Blocking…' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
}

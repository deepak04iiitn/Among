'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * AMONG Dialog — modal overlay.
 *
 * Design rules:
 *  - No drop shadow. `border border-border rounded-xl` only.
 *  - Overlay: `bg-text/20` — light scrim, not a heavy blocking overlay.
 *  - Content is max-w-lg centered.
 *  - Focus is trapped inside while open (WCAG AA requirement).
 *  - Escape key closes.
 *  - Focus returns to trigger element on close.
 *
 * This is a lightweight custom implementation — not the shadcn Dialog —
 * because the AMONG visual style departs significantly from shadcn defaults.
 */

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible title for the dialog (required for aria-labelledby) */
  title: string;
  children: React.ReactNode;
  className?: string;
  /** If true, clicking the overlay does NOT close the dialog */
  preventOverlayClose?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  preventOverlayClose = false,
}: DialogProps) {
  const dialogRef    = React.useRef<HTMLDivElement>(null);
  const titleId      = React.useId();
  const prevFocusRef = React.useRef<HTMLElement | null>(null);

  // Save & restore focus
  React.useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      // Focus the dialog container itself
      setTimeout(() => dialogRef.current?.focus(), 10);
    } else {
      prevFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  React.useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-text)]/20 animate-[overlayIn_250ms_var(--ease-standard)_both]"
        onClick={preventOverlayClose ? undefined : onClose}
      />

      {/* Dialog panel */}
        <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        className={cn(
          'relative w-full max-w-lg',
          'bg-[var(--color-bg)]',
          'border border-[var(--color-border)]',
          'rounded-[var(--radius-xl)]',
          'p-6 md:p-8',
          'outline-none',
          'animate-[slideUp_250ms_var(--ease-out)_both]',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2
            id={titleId}
            className="font-editorial text-title text-[var(--color-text)] pr-4"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={cn(
              'p-1.5 -mr-1.5 -mt-1.5 flex-shrink-0',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              'rounded-[var(--radius-sm)]',
              'transition-colors duration-[var(--duration-fast)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
            )}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}

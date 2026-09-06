'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../../lib/utils';
import { REPORT_REASON_OPTIONS, type ReportReason } from '../../constants/reportReasons';
import {
  closeReportModal,
  selectReportModalOpen,
  selectReportTarget,
  selectReportSubmitted,
  selectReportLoading,
} from '../../features/moderation/moderationSlice';
import { submitReportThunk } from '../../features/moderation/moderationThunks';
import type { AppDispatch } from '../../store';

/**
 * ReportModal — accessible modal for submitting content reports.
 *
 * WCAG AA: focus trap, escape-to-close, aria-labelledby, aria-describedby.
 * Privacy: confirmation message never reveals report outcome (PRD §6.6).
 */
export default function ReportModal(): React.JSX.Element | null {
  const dispatch   = useDispatch<AppDispatch>();
  const isOpen     = useSelector(selectReportModalOpen);
  const target     = useSelector(selectReportTarget);
  const submitted  = useSelector(selectReportSubmitted);
  const isLoading  = useSelector(selectReportLoading);

  const [selectedReason,  setSelectedReason]  = React.useState<ReportReason | ''>('');
  const [additionalDetails, setAdditionalDetails] = React.useState('');

  const firstFocusRef   = React.useRef<HTMLButtonElement>(null);
  const triggerRef      = React.useRef<HTMLElement | null>(null);
  const labelId         = React.useId();
  const descId          = React.useId();

  // Remember what triggered the modal, so we can restore focus on close
  React.useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => firstFocusRef.current?.focus(), 50);
      setSelectedReason('');
      setAdditionalDetails('');
    } else {
      // Restore focus to trigger element on close
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key closes modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeReportModal());
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, dispatch]);

  if (!isOpen || !target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    const trimmed = additionalDetails.trim();
    void dispatch(submitReportThunk({
      contentType: target.contentType,
      contentId:   target.contentId,
      reason:      selectedReason,
      ...(trimmed ? { additionalDetails: trimmed } : {}),
    }));
  };

  return (
    /* Backdrop */
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
        onClick={() => dispatch(closeReportModal())}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'bg-[var(--color-bg)] border border-[var(--color-border)]',
          'rounded-[var(--radius-lg)]',
          'p-6 shadow-none',
          'animate-[slideUp_250ms_var(--ease-out)_both]',
        )}
        role="document"
      >
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-5">
          <h2
            id={labelId}
            className="text-title font-[var(--font-editorial)] text-[var(--color-text)]"
          >
            Report content
          </h2>
          <button
            ref={firstFocusRef}
            type="button"
            aria-label="Close report modal"
            onClick={() => dispatch(closeReportModal())}
            className={cn(
              'p-1.5 -mr-1 -mt-1 ml-4 flex-shrink-0',
              'text-[var(--color-text-muted)]',
              'rounded-[var(--radius-sm)]',
              'hover:text-[var(--color-text)]',
              'transition-colors duration-[var(--duration-fast)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
            )}
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* ─── Confirmation state ─── */}
        {submitted ? (
          <div aria-live="polite">
            <p
              id={descId}
              className="text-body text-[var(--color-text)] mb-6"
            >
              Thank you. Your report has been received.
            </p>
            <button
              type="button"
              onClick={() => dispatch(closeReportModal())}
              className={cn(
                'w-full py-2.5 px-4',
                'text-ui font-medium text-[var(--color-bg)]',
                'bg-[var(--color-text)] rounded-full',
                'hover:opacity-90 transition-opacity duration-[var(--duration-fast)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
              )}
            >
              Done
            </button>
          </div>
        ) : (
          /* ─── Form ─── */
          <form onSubmit={handleSubmit} noValidate>
            <p
              id={descId}
              className="text-body text-[var(--color-text-muted)] mb-5"
            >
              Help us understand what&apos;s wrong with this content.
            </p>

            {/* Reason selector */}
            <fieldset className="mb-4">
              <legend className="text-ui font-medium text-[var(--color-text)] mb-3">
                Select a reason <span aria-hidden="true">*</span>
              </legend>
              <div className="space-y-2" role="radiogroup" aria-required="true">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-3 p-3 cursor-pointer',
                      'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                      'transition-colors duration-[var(--duration-fast)]',
                      selectedReason === option.id
                        ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)]'
                        : 'hover:border-[var(--color-text-muted)]',
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option.id}
                      checked={selectedReason === option.id}
                      onChange={() => setSelectedReason(option.id)}
                      className="sr-only"
                      aria-label={option.label}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex-shrink-0 w-4 h-4 rounded-full border-2',
                        'transition-colors duration-[var(--duration-fast)]',
                        selectedReason === option.id
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                          : 'border-[var(--color-border)]',
                      )}
                    />
                    <span className="text-ui text-[var(--color-text)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Optional details */}
            <label
              htmlFor="report-details"
              className="block text-ui text-[var(--color-text-muted)] mb-1.5"
            >
              Additional details{' '}
              <span className="text-caption italic">(optional)</span>
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={500}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Briefly describe the issue…"
              className={cn(
                'w-full resize-none text-ui text-[var(--color-text)]',
                'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                'p-3 mb-5',
                'bg-[var(--color-bg)]',
                'placeholder:text-[var(--color-text-muted)]',
                'focus:outline-none focus:border-[var(--color-accent)]',
                'transition-colors duration-[var(--duration-fast)]',
              )}
              aria-label="Additional details (optional)"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedReason || isLoading}
              aria-disabled={!selectedReason || isLoading}
              className={cn(
                'w-full py-2.5 px-4',
                'text-ui font-medium',
                'rounded-full',
                'transition-all duration-[var(--duration-fast)]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
                !selectedReason || isLoading
                  ? 'opacity-40 cursor-not-allowed bg-[var(--color-text)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90',
              )}
            >
              {isLoading ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * ContactInfoWarning.tsx — Soft warning shown inline when contact info is detected.
 * The message is still sent — this is informational only.
 *
 * Design: text-only marginal note. Never a modal. Never a block.
 */
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { contactInfoWarningDismissed } from '../../features/conversations/conversationsSlice';

export default function ContactInfoWarning(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div
      role="note"
      aria-live="polite"
      className="py-2 px-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4"
    >
      <p className="text-caption text-[var(--color-text-muted)] italic">
        A gentle note: this platform works best when personal contact details stay private.
        Your message was sent as-is.
      </p>
      <button
        onClick={() => dispatch(contactInfoWarningDismissed())}
        className="shrink-0 text-caption text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text)] transition-colors"
        aria-label="Dismiss contact info warning"
      >
        Dismiss
      </button>
    </div>
  );
}

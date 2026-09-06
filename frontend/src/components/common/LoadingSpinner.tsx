import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Accessible label — required for screen readers */
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Loading spinner — used only for action-in-progress states.
 * (Submitting a post, sending a message, requesting a match.)
 * NOT used as a page-level loader — skeletons handle that.
 *
 * Uses a lucide-react Loader2 icon with a rotation animation.
 * No gradient, no bounce — just a calm, minimal spin.
 */
export default function LoadingSpinner({
  label = 'Loading…',
  size = 20,
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={['inline-flex items-center justify-center', className].join(' ')}
    >
      <Loader2
        size={size}
        strokeWidth={1.5}
        className="animate-spin text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  /** Main typographic statement — editorial voice, not generic */
  message: string;
  /** Optional supporting line in smaller, muted text */
  subMessage?: string;
  /** Optional CTA — rendered as a link or button */
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * Empty state — typographic only.
 * No illustrated mascots. No generic "nothing here" copy.
 * Every empty state maintains the product's quiet, human voice.
 *
 * Examples:
 * - "Nothing new today. Come back tomorrow — the pool refreshes."
 * - "You haven't saved anything yet. Something will speak to you."
 * - "No conversations yet. When the moment feels right, reach out."
 *
 * Font: font-editorial text-title text-text-muted for the main line.
 */
export default function EmptyState({
  message,
  subMessage,
  cta,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className,
      ].join(' ')}
    >
      <p className="font-editorial text-title text-[var(--color-text-muted)] text-balance max-w-[40ch]">
        {message}
      </p>

      {subMessage && (
        <p className="mt-3 text-body text-[var(--color-text-muted)] max-w-[40ch]">
          {subMessage}
        </p>
      )}

      {cta && (
        <div className="mt-6">
          {cta.href ? (
            <a
              href={cta.href}
              className="btn-secondary text-ui"
            >
              {cta.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={cta.onClick}
              className="btn-secondary text-ui"
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

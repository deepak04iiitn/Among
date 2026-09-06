interface ErrorStateProps {
  /** Primary error message — user-facing, not a raw error string */
  message?: string;
  /** Optional retry action */
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state — shown when a page or section fails to load.
 * Typographic only, calm tone — never scary or alarming.
 * Provides a retry action when applicable.
 *
 * Design: muted error color, no borders, no icons — just honest text.
 */
export default function ErrorState({
  message = 'Something went wrong. Try refreshing the page.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className,
      ].join(' ')}
    >
      <p className="font-editorial text-title text-[var(--color-error)] text-balance max-w-[40ch]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 btn-secondary text-ui"
        >
          Try again
        </button>
      )}
    </div>
  );
}

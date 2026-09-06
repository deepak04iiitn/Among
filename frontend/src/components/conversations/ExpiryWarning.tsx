/**
 * ExpiryWarning.tsx — Non-intrusive inline warning shown before conversation expiry.
 * Renders at the top of the ConversationThread.
 *
 * Design: text-only. No color, no icon emphasis. Quiet urgency.
 */

interface ExpiryWarningProps {
  type:             'inactivity' | 'max_duration';
  minutesRemaining: number | null;
}

export default function ExpiryWarning({
  type,
  minutesRemaining,
}: ExpiryWarningProps): React.JSX.Element {
  const isInactivity = type === 'inactivity';
  const timeStr = minutesRemaining !== null ? `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}` : 'a few minutes';

  return (
    <div
      role="status"
      aria-live="polite"
      className="py-3 px-4 border-b border-[var(--color-border)] text-center"
    >
      <p className="text-caption text-[var(--color-text-muted)]">
        {isInactivity ? (
          <>
            This conversation will end in{' '}
            <span className="font-medium text-[var(--color-text)]">{timeStr}</span>
            {' '}due to inactivity.{' '}
            <span className="italic">Send a message to keep it going.</span>
          </>
        ) : (
          <>
            <span className="font-medium text-[var(--color-text)]">{timeStr}</span>
            {' '}remaining in this conversation.
          </>
        )}
      </p>
    </div>
  );
}

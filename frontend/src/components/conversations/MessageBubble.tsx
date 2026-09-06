/**
 * MessageBubble.tsx — A single message in a conversation thread.
 *
 * Design (per PRD §7.3):
 *  - Own messages: full-width text, no bubble. Right-side indicator.
 *  - Other party: pl-5 border-l-2 border-border indented block quote.
 *  - Alias shown once per message group (parent handles grouping).
 *  - No read receipts.
 *  - No "You" label — alias IS the identity.
 */

import type { PublicMessage } from '../../features/conversations/conversationsSlice';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message:    PublicMessage;
  isOwn:      boolean;
  showAlias:  boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  isOwn,
  showAlias,
}: MessageBubbleProps): React.JSX.Element {
  return (
    <div
      className={`mb-4 ${isOwn ? 'text-right' : ''}`}
      data-testid={isOwn ? 'own-message' : 'other-message'}
    >
      {showAlias && (
        <p className={`text-caption text-[var(--color-text-muted)] mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {message.senderAliasSnapshot}
        </p>
      )}

      {isOwn ? (
        // Own message — plain text, right-aligned
        <p className="text-body text-[var(--color-text)] inline-block text-right max-w-[80%]">
          {message.isDeleted ? (
            <span className="italic text-[var(--color-text-muted)]">[Message removed]</span>
          ) : (
            message.body
          )}
        </p>
      ) : (
        // Other party — indented block quote style
        <div className="pl-5 border-l-2 border-[var(--color-border)] max-w-[80%]">
          <p className="text-body text-[var(--color-text)]">
            {message.isDeleted ? (
              <span className="italic text-[var(--color-text-muted)]">[Message removed]</span>
            ) : (
              message.body
            )}
          </p>
        </div>
      )}

      <p className={`text-caption text-[var(--color-text-muted)] mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
        {formatTimeAgo(new Date(message.sentAt))}
      </p>
    </div>
  );
}

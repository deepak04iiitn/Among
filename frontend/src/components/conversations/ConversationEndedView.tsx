/**
 * ConversationEndedView.tsx — Read-only transcript after a conversation ends.
 *
 * PRD §12.6:
 *  - Transcript available for TRANSCRIPT_RETENTION_MS, then hidden.
 *  - Optional "Was this helpful?" prompt.
 *  - No re-contact option — new match required.
 */
'use client';

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { submitFeedbackThunk } from '../../features/conversations/conversationsThunks';
import type { ConversationDetail, PublicMessage } from '../../features/conversations/conversationsSlice';
import MessageBubble from './MessageBubble';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationEndedViewProps {
  conversation: ConversationDetail;
  messages:     PublicMessage[];
  myAliasName:  string;
}

// ─── End reason display ───────────────────────────────────────────────────────

const END_REASON_LABELS: Record<string, string> = {
  ended_by_user:         'This conversation was ended.',
  inactivity:            'This conversation ended due to inactivity.',
  max_duration:          'This conversation reached its time limit.',
  ended_moderation:      'This conversation was ended by moderation.',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConversationEndedView({
  conversation,
  messages,
  myAliasName,
}: ConversationEndedViewProps): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const endLabel = END_REASON_LABELS[conversation.endReason ?? ''] ?? 'This conversation has ended.';

  const handleFeedback = (helpful: boolean): void => {
    void dispatch(submitFeedbackThunk(conversation.id, helpful));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── End notice ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          {endLabel}
        </p>
        {conversation.endedAt && (
          <p className="text-caption text-[var(--color-text-muted)]">
            {new Date(conversation.endedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* ── Transcript ───────────────────────────────────────────────────── */}
      {conversation.transcriptVisible ? (
        <div
          className="space-y-2 mb-10"
          role="log"
          aria-label="Conversation transcript"
        >
          {messages.map((msg, i) => {
            const prev      = messages[i - 1];
            const isOwn     = msg.senderAliasSnapshot === myAliasName;
            const showAlias = !prev || prev.senderAliasSnapshot !== msg.senderAliasSnapshot;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showAlias={showAlias}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 mb-10">
          <p className="font-editorial text-title text-[var(--color-text-muted)]">
            Transcript no longer available.
          </p>
          <p className="text-body text-[var(--color-text-muted)] mt-2">
            Transcripts are available for 24 hours after a conversation ends.
          </p>
        </div>
      )}

      {/* ── Feedback prompt ──────────────────────────────────────────────── */}
      {!conversation.feedbackSubmitted && (
        <div className="border-t border-[var(--color-border)] pt-6 text-center">
          <p className="text-body text-[var(--color-text)] mb-4">
            Was this conversation helpful?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleFeedback(true)}
              className="px-6 py-2 rounded-full border border-[var(--color-border)] text-ui text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="Yes, this conversation was helpful"
            >
              Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="px-6 py-2 rounded-full border border-[var(--color-border)] text-ui text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              aria-label="No, this conversation was not helpful"
            >
              Not really
            </button>
          </div>
        </div>
      )}

      {/* ── No re-contact note ────────────────────────────────────────────── */}
      <div className="mt-10 text-center">
        <p className="text-caption text-[var(--color-text-muted)] italic">
          Conversations on AMONG are temporary by design. To connect again, start a new match from the home page.
        </p>
      </div>
    </div>
  );
}

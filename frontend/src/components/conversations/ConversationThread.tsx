/**
 * ConversationThread.tsx — Full real-time conversation view.
 *
 * Responsibilities:
 *  - Renders messages grouped by sender for alias display.
 *  - Shows ExpiryWarning and ContactInfoWarning when active.
 *  - Provides message compose area.
 *  - Report and End Conversation controls always visible.
 *  - Uses socket for real-time; HTTP fallback for initial load.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store';
import {
  selectMessages,
  selectMessagesStatus,
  selectExpiryWarning,
  selectContactInfoWarning,
} from '../../features/conversations/conversationsSlice';
import {
  fetchMessagesThunk,
  sendMessageThunk,
  endConversationThunk,
} from '../../features/conversations/conversationsThunks';
import { useConversationExpiry } from '../../hooks/useConversationExpiry';
import type { ConversationDetail, PublicMessage } from '../../features/conversations/conversationsSlice';
import MessageBubble from './MessageBubble';
import ExpiryWarning from './ExpiryWarning';
import ContactInfoWarning from './ContactInfoWarning';
import ConversationContextCard from './ConversationContextCard';
import { MESSAGE_MAX_CHARS } from '../../constants/limits';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationThreadProps {
  conversation:    ConversationDetail;
  myAliasName:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Group consecutive messages from the same sender */
function groupMessages(messages: PublicMessage[], myAlias: string): {
  message: PublicMessage;
  isOwn:   boolean;
  showAlias: boolean;
}[] {
  return messages.map((msg, i) => {
    const isOwn    = msg.senderAliasSnapshot === myAlias;
    const prev     = messages[i - 1];
    const showAlias = !prev || prev.senderAliasSnapshot !== msg.senderAliasSnapshot;
    return { message: msg, isOwn, showAlias };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConversationThread({
  conversation,
  myAliasName,
}: ConversationThreadProps): React.JSX.Element {
  const dispatch       = useDispatch<AppDispatch>();
  const messages       = useSelector(selectMessages(conversation.id));
  const status         = useSelector(selectMessagesStatus);
  const expiryWarning  = useSelector(selectExpiryWarning);
  const contactWarning = useSelector(selectContactInfoWarning);
  const expiryState    = useConversationExpiry(conversation);

  const [body, setBody]         = useState('');
  const [charCount, setCharCount] = useState(0);
  const bottomRef               = useRef<HTMLDivElement>(null);

  const isEnded = ['ended_by_user', 'ended_inactivity', 'ended_max_duration', 'ended_moderation'].includes(conversation.state);
  const showCharCount = charCount > MESSAGE_MAX_CHARS - 200;

  useEffect(() => {
    void dispatch(fetchMessagesThunk(conversation.id));
  }, [conversation.id, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (): void => {
    const trimmed = body.trim();
    if (!trimmed || status === 'sending') return;
    void dispatch(sendMessageThunk(conversation.id, trimmed));
    setBody('');
    setCharCount(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setBody(e.target.value);
    setCharCount(e.target.value.length);
  };

  const grouped = groupMessages(messages, myAliasName);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* ── Expiry warning ──────────────────────────────────────────────── */}
      {(expiryWarning || expiryState.inactivityWarning || expiryState.maxDurationWarning) && (
        <ExpiryWarning
          type={expiryState.maxDurationWarning ? 'max_duration' : 'inactivity'}
          minutesRemaining={expiryState.minutesRemaining}
        />
      )}

      {/* ── Contact info warning ─────────────────────────────────────────── */}
      {contactWarning && <ContactInfoWarning />}

      {/* ── Context card (MATCHED_PENDING — no messages yet) ─────────────── */}
      {conversation.state === 'matched_pending' && messages.length === 0 && (
        <div className="px-4 pt-6">
          <ConversationContextCard contextCategoryId={conversation.contextCategoryId} />
        </div>
      )}

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
      >
        {grouped.map(({ message, isOwn, showAlias }) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            showAlias={showAlias}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)] px-4 pt-4 pb-6">
        {!isEnded ? (
          <>
            <div className="relative">
              <label htmlFor="message-input" className="sr-only">
                Write a message
              </label>
              <textarea
                id="message-input"
                value={body}
                onChange={handleBodyChange}
                onKeyDown={handleKeyDown}
                placeholder="Write something…"
                maxLength={MESSAGE_MAX_CHARS}
                rows={3}
                disabled={status === 'sending'}
                className="w-full resize-none border-0 outline-none text-body text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] bg-transparent focus:ring-0"
                aria-label="Message input"
              />
              {showCharCount && (
                <p
                  className={`text-caption text-right ${
                    charCount >= MESSAGE_MAX_CHARS
                      ? 'text-red-500'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                  aria-live="polite"
                >
                  {MESSAGE_MAX_CHARS - charCount} remaining
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => void dispatch(endConversationThunk(conversation.id))}
                className="text-ui text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text)] transition-colors"
                aria-label="End this conversation"
              >
                End conversation
              </button>
              <button
                onClick={handleSend}
                disabled={!body.trim() || status === 'sending'}
                className="px-5 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-ui font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                aria-label="Send message"
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-caption text-[var(--color-text-muted)] italic text-center py-4">
            This conversation has ended.
          </p>
        )}
      </div>
    </div>
  );
}

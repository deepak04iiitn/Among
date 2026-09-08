/**
 * ConversationDetailView.tsx — Thread, matching wait, or ended transcript.
 */
'use client';

import { useEffect } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchConversationThunk,
  fetchMessagesThunk,
} from '../../features/conversations/conversationsThunks';
import {
  matchingStarted,
  matchingFailed,
  selectActiveDetail,
  selectDetailStatus,
  selectConversationsError,
  selectMessages,
} from '../../features/conversations/conversationsSlice';
import { selectAliasName } from '../../features/identity/identitySlice';
import { selectIdToken } from '../../features/auth/authSlice';
import { useSocket } from '../../hooks/useSocket';
import {
  CONVERSATION_STATE,
  ENDED_CONVERSATION_STATES,
  type ConversationState,
} from '../../constants/conversationStates';
import { ROUTES } from '../../constants/routes';
import ConversationThread from './ConversationThread';
import ConversationEndedView from './ConversationEndedView';
import MatchingState from './MatchingState';

interface ConversationDetailViewProps {
  conversationId: string;
}

export default function ConversationDetailView({
  conversationId,
}: ConversationDetailViewProps): JSX.Element {
  const dispatch     = useAppDispatch();
  const detail       = useAppSelector(selectActiveDetail);
  const status       = useAppSelector(selectDetailStatus);
  const error        = useAppSelector(selectConversationsError);
  const messages     = useAppSelector(selectMessages(conversationId));
  const identityName = useAppSelector(selectAliasName);
  const idToken      = useAppSelector(selectIdToken);

  useSocket(conversationId, idToken);

  useEffect(() => {
    void dispatch(fetchConversationThunk(conversationId));
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!detail || detail.id !== conversationId) return;

    if (detail.state === CONVERSATION_STATE.REQUESTED) {
      void dispatch(matchingStarted(detail.id));
    }
    if (detail.state === CONVERSATION_STATE.NO_MATCH_FOUND) {
      void dispatch(matchingFailed());
    }
    if (ENDED_CONVERSATION_STATES.has(detail.state as ConversationState)) {
      void dispatch(fetchMessagesThunk(detail.id));
    }
  }, [dispatch, detail, conversationId]);

  const myAliasName =
    detail?.myAliasSnapshot.aliasName ?? identityName ?? 'You';

  const awaitingThis = !detail || detail.id !== conversationId;
  const isLoading =
    status === 'loading' ||
    (status === 'idle' && awaitingThis && error === null);

  if (isLoading) {
    return (
      <div className="content-column py-16" aria-busy="true" aria-live="polite">
        <h1 className="sr-only">Conversation</h1>
        <div className="space-y-4 max-w-2xl">
          <div className="h-4 w-40 bg-[var(--color-border)] rounded animate-pulse" />
          <div className="h-8 bg-[var(--color-border)] rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-[var(--color-border)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !detail || detail.id !== conversationId) {
    return (
      <div className="content-column py-16">
        <h1 className="sr-only">Conversation</h1>
        <p className="font-editorial text-title text-[var(--color-text-muted)]">
          {error ?? 'This conversation could not be opened.'}
        </p>
        <Link
          href={ROUTES.CONVERSATIONS}
          className="inline-block mt-5 text-ui text-[var(--color-accent)] underline underline-offset-2 hover:opacity-75"
        >
          Back to conversations →
        </Link>
      </div>
    );
  }

  if (
    detail.state === CONVERSATION_STATE.REQUESTED ||
    detail.state === CONVERSATION_STATE.NO_MATCH_FOUND
  ) {
    return (
      <div className="content-column py-6">
        <h1 className="sr-only">Looking for a conversation</h1>
        <MatchingState
          onMatchFound={() => {
            void dispatch(fetchConversationThunk(conversationId));
          }}
        />
      </div>
    );
  }

  if (ENDED_CONVERSATION_STATES.has(detail.state as ConversationState)) {
    return (
      <div className="content-column py-6">
        <h1 className="sr-only">Ended conversation</h1>
        <ConversationEndedView
          conversation={detail}
          messages={messages}
          myAliasName={myAliasName}
        />
      </div>
    );
  }

  return (
    <div className="content-column py-6 min-h-[70vh]">
      <h1 className="sr-only">Conversation with {detail.otherAliasSnapshot?.aliasName ?? 'someone'}</h1>
      <ConversationThread conversation={detail} myAliasName={myAliasName} />
    </div>
  );
}

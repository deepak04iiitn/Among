/**
 * Conversations list — temporary matches, no persistent inbox identity.
 */
'use client';

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  fetchConversationsThunk,
} from '../../../features/conversations/conversationsThunks';
import {
  selectConversationsList,
  selectConversationsListStatus,
  selectConversationsError,
} from '../../../features/conversations/conversationsSlice';
import ConversationList from '../../../components/conversations/ConversationList';
import { ROUTES } from '../../../constants/routes';

export default function ConversationsPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const list     = useAppSelector(selectConversationsList);
  const status   = useAppSelector(selectConversationsListStatus);
  const error    = useAppSelector(selectConversationsError);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    void (async () => {
      await dispatch(fetchConversationsThunk());
      setAttempted(true);
    })();
  }, [dispatch]);

  const isLoading = !attempted || status === 'loading';

  return (
    <div className="content-column py-10">
      <h1 className="font-editorial text-title-xl text-[var(--color-text)] mb-2">
        Conversations
      </h1>
      <p className="text-body text-[var(--color-text-muted)] mb-10 max-w-reading">
        Temporary, one-to-one. They end on their own — nothing here follows you.
      </p>

      {isLoading && list.length === 0 && (
        <div aria-busy="true" aria-live="polite" className="space-y-6 py-4">
          <div className="h-12 bg-[var(--color-border)] rounded animate-pulse" />
          <div className="h-12 bg-[var(--color-border)] rounded animate-pulse w-5/6" />
          <div className="h-12 bg-[var(--color-border)] rounded animate-pulse w-2/3" />
        </div>
      )}

      {status === 'error' && (
        <div>
          <p className="font-editorial text-title text-[var(--color-text-muted)]">
            {error ?? 'Could not load conversations.'}
          </p>
          <button
            type="button"
            onClick={() => void dispatch(fetchConversationsThunk())}
            className="mt-4 text-ui text-[var(--color-accent)] underline underline-offset-2 hover:opacity-75"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && status !== 'error' && list.length === 0 && (
        <div>
          <p className="font-editorial text-title text-[var(--color-text-muted)] max-w-reading">
            No conversations yet.
          </p>
          <p className="mt-3 text-body text-[var(--color-text-muted)] max-w-reading">
            Start one from an experience — look for{' '}
            <span className="italic">Talk to someone</span> on the home feed.
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-block mt-6 text-ui text-[var(--color-accent)] underline underline-offset-2 hover:opacity-75"
          >
            Go to home →
          </Link>
        </div>
      )}

      {list.length > 0 && <ConversationList conversations={list} />}
    </div>
  );
}

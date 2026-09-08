/**
 * ConversationList.tsx — Inbox of temporary conversations.
 *
 * Single-column editorial list. No chat-bubble preview, no unread badges.
 * Alias is the identity surface; conversation state is a quiet caption.
 */
'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import AvatarSVG from '../common/AvatarSVG';
import { ROUTES } from '../../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import {
  CONVERSATION_STATE,
  CONVERSATION_STATE_LABELS,
  type ConversationState,
} from '../../constants/conversationStates';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import type { ConversationListItem } from '../../lib/conversationsApi';

interface ConversationListProps {
  conversations: ConversationListItem[];
}

function categoryLabel(categoryId: string): string {
  return EXPERIENCE_CATEGORIES.find((c) => c.id === categoryId)?.displayName ?? categoryId;
}

function stateLabel(state: string): string {
  return CONVERSATION_STATE_LABELS[state as ConversationState] ?? state;
}

function timestampFor(item: ConversationListItem): string | null {
  return item.lastActivityAt ?? item.startedAt ?? item.endedAt;
}

export default function ConversationList({ conversations }: ConversationListProps): JSX.Element {
  return (
    <ul className="divide-y divide-[var(--color-border)]" aria-label="Your conversations">
      {conversations.map((item) => {
        const aliasName = item.otherAliasSnapshot?.aliasName ?? 'Someone';
        const avatarSeed = item.otherAliasSnapshot?.avatarSeed ?? item.id;
        const isSearching = item.state === CONVERSATION_STATE.REQUESTED;
        const time = timestampFor(item);

        return (
          <li key={item.id}>
            <Link
              href={ROUTES.CONVERSATION_DETAIL(item.id)}
              className="flex items-center gap-4 py-5 min-h-[44px] hover:opacity-80 transition-opacity duration-[var(--duration-fast)]"
              aria-label={
                isSearching
                  ? `Looking for someone in ${categoryLabel(item.contextCategoryId)}`
                  : `Conversation with ${aliasName}`
              }
            >
              <AvatarSVG seed={avatarSeed} size="md" aliasName={aliasName} />
              <div className="min-w-0 flex-1">
                <p className="text-body text-[var(--color-text)] truncate">
                  {isSearching ? 'Looking for someone…' : aliasName}
                </p>
                <p className="text-caption text-[var(--color-text-muted)] mt-0.5">
                  {categoryLabel(item.contextCategoryId)}
                  {' · '}
                  {stateLabel(item.state)}
                </p>
              </div>
              {time && (
                <time
                  className="text-caption text-[var(--color-text-muted)] shrink-0"
                  dateTime={time}
                >
                  {formatTimeAgo(time)}
                </time>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Home feed page — primary daily experience + secondary discovery list.
 *
 * Wires:
 *  - fetchHomeFeedThunk  → primary + secondary posts from the ranking engine
 *  - fetchReactionForPostThunk → reaction counts & own reaction for the primary post
 *  - setReactionThunk / removeReactionThunk → optimistic reaction updates
 *
 * Design (PRD §7.3):
 *  - Primary card: editorial-weight, full body, no card chrome.
 *  - Secondary list: single-column, 3-line body clamp, text-only.
 *  - Loading: typographic skeleton — no spinner, no illustrated placeholder.
 *  - Empty state: editorial prose, no mascot or illustration.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchHomeFeedThunk } from '../../../features/discovery/discoveryThunks';
import {
  fetchReactionForPostThunk,
  setReactionThunk,
  removeReactionThunk,
} from '../../../features/reactions/reactionsThunks';
import { requestMatchThunk } from '../../../features/conversations/conversationsThunks';
import {
  selectPrimaryPost,
  selectSecondaryPosts,
  selectFeedLoading,
  selectFeedError,
  selectFeedFetched,
} from '../../../features/discovery/discoverySlice';
import {
  selectReactionCounts,
  selectUserReactions,
} from '../../../features/reactions/reactionsSlice';
import { PrimaryExperienceCard } from '../../../components/discovery/PrimaryExperienceCard';
import { SecondaryDiscoveryList } from '../../../components/discovery/SecondaryDiscoveryList';
import type { ApiReactionCounts, ApiUserReaction } from '../../../lib/reactionsApi';
import type { PrimaryReactionId, SecondaryReactionId } from '../../../constants/reactionTypes';
import { PRIMARY_REACTION_IDS, SECONDARY_REACTION_IDS } from '../../../constants/reactionTypes';
import { ROUTES } from '../../../constants/routes';
import type { AppDispatch } from '../../../store';

// Metadata is ignored in a 'use client' file — defined in the layout instead.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _metadata: Partial<Metadata> = {
  title: 'Home',
  robots: { index: false, follow: false },
};

// ─── Primary reaction values as an array for fast lookup ─────────────────────
const PRIMARY_IDS = Object.values(PRIMARY_REACTION_IDS) as PrimaryReactionId[];
const SECONDARY_IDS = Object.values(SECONDARY_REACTION_IDS) as SecondaryReactionId[];

// ─── Build ApiReactionCounts from raw Record<string, number> ─────────────────
function buildCounts(raw: Record<string, number>): ApiReactionCounts {
  return {
    current:     raw['current']     ?? 0,
    past:        raw['past']        ?? 0,
    considering: raw['considering'] ?? 0,
    same:        raw['same']        ?? 0,
    iUnderstand: raw['iUnderstand'] ?? 0,
    iLearned:    raw['iLearned']    ?? 0,
    iDisagree:   raw['iDisagree']   ?? 0,
    tellMeMore:  raw['tellMeMore']  ?? 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const dispatch       = useAppDispatch() as AppDispatch;
  const router         = useRouter();

  const primaryPost    = useAppSelector(selectPrimaryPost);
  const secondaryPosts = useAppSelector(selectSecondaryPosts);
  const feedLoading    = useAppSelector(selectFeedLoading);
  const feedError      = useAppSelector(selectFeedError);
  const feedFetched    = useAppSelector(selectFeedFetched);

  const postId         = primaryPost?.id ?? '';
  const rawCounts      = useAppSelector(selectReactionCounts(postId));
  const userReactionIds = useAppSelector(selectUserReactions(postId));

  // ── Fetch feed on mount ───────────────────────────────────────────────────
  useEffect(() => {
    void dispatch(fetchHomeFeedThunk());
  }, [dispatch]);

  // ── Fetch reactions when primary post becomes available ───────────────────
  useEffect(() => {
    if (postId) {
      void dispatch(fetchReactionForPostThunk(postId));
    }
  }, [dispatch, postId]);

  // ── Derived reaction state ────────────────────────────────────────────────
  const counts = buildCounts(rawCounts);

  const myReaction: ApiUserReaction | null = postId
    ? {
        postId,
        primaryReaction:
          (userReactionIds.find((id) => PRIMARY_IDS.includes(id as PrimaryReactionId)) as PrimaryReactionId) ?? null,
        secondaryReactions: userReactionIds.filter((id) =>
          SECONDARY_IDS.includes(id as SecondaryReactionId)
        ) as SecondaryReactionId[],
      }
    : null;

  // ── Reaction handlers ────────────────────────────────────────────────────
  function handleSetPrimary(id: PrimaryReactionId | null): void {
    if (!primaryPost) return;
    void dispatch(setReactionThunk({ postId: primaryPost.id, primaryReaction: id }));
  }

  function handleToggleSecondary(id: SecondaryReactionId): void {
    if (!primaryPost || !myReaction) return;
    const current = myReaction.secondaryReactions;
    const next = current.includes(id)
      ? current.filter((r) => r !== id)
      : ([...current, id] as SecondaryReactionId[]);
    void dispatch(setReactionThunk({ postId: primaryPost.id, secondaryReactions: next }));
  }

  function handleRemoveAll(): void {
    if (!primaryPost) return;
    void dispatch(removeReactionThunk(primaryPost.id));
  }

  async function handleTalkToSomeone(): Promise<void> {
    if (!primaryPost) return;
    const categoryId = primaryPost.categoryIds[0];
    if (!categoryId) return;
    const conversationId = await dispatch(requestMatchThunk({
      contextCategoryId: categoryId,
      contextPostId:     primaryPost.id,
    }));
    if (conversationId) {
      router.push(ROUTES.CONVERSATION_DETAIL(conversationId));
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (feedLoading && !feedFetched) {
    return (
      <div className="content-column py-10" aria-busy="true" aria-label="Loading your feed">
        <h1 className="sr-only">Your home feed</h1>
        <div className="py-16 space-y-8 max-w-2xl">
          {/* Category label skeleton */}
          <div className="h-2.5 w-20 bg-[var(--color-border)] rounded animate-pulse" />
          {/* Body text skeleton — 3 lines */}
          <div className="space-y-4">
            <div className="h-9 bg-[var(--color-border)] rounded animate-pulse" />
            <div className="h-9 w-5/6 bg-[var(--color-border)] rounded animate-pulse" />
            <div className="h-9 w-3/5 bg-[var(--color-border)] rounded animate-pulse" />
          </div>
          {/* Reaction bar skeleton */}
          <div className="h-px bg-[var(--color-border)]" />
          <div className="flex gap-4">
            <div className="h-8 w-20 bg-[var(--color-border)] rounded-full animate-pulse" />
            <div className="h-8 w-20 bg-[var(--color-border)] rounded-full animate-pulse" />
            <div className="h-8 w-20 bg-[var(--color-border)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (feedError) {
    return (
      <div className="content-column py-16">
        <h1 className="sr-only">Your home feed</h1>
        <p className="font-editorial text-title text-[var(--color-text-muted)] max-w-xl">
          Something went wrong loading your feed.
        </p>
        <button
          type="button"
          onClick={() => void dispatch(fetchHomeFeedThunk())}
          className="mt-5 text-ui text-[var(--color-accent)] underline underline-offset-2 hover:opacity-75 transition-opacity"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (feedFetched && !primaryPost) {
    return (
      <div className="content-column py-16">
        <h1 className="sr-only">Your home feed</h1>
        <p className="font-editorial text-title text-[var(--color-text-muted)] max-w-reading">
          Nothing new today. Come back tomorrow — the pool refreshes.
        </p>
        <p className="mt-4 text-body text-[var(--color-text-muted)] max-w-reading">
          In the meantime, you can{' '}
          <a href="/explore" className="text-[var(--color-accent)] underline underline-offset-2 hover:opacity-75 transition-opacity">
            explore experiences by category
          </a>
          .
        </p>
      </div>
    );
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Your home feed</h1>

      {/* Primary experience — THE focal element of the page */}
      {primaryPost && (
        <PrimaryExperienceCard
          post={primaryPost}
          counts={counts}
          myReaction={myReaction}
          onSetPrimary={handleSetPrimary}
          onToggleSecondary={handleToggleSecondary}
          onRemoveAll={handleRemoveAll}
          onConversationRequest={() => void handleTalkToSomeone()}
        />
      )}

      {/* Secondary list — up to 5 posts, editorial single-column */}
      {secondaryPosts.length > 0 && (
        <div className="border-t border-[var(--color-border)] mt-4">
          <SecondaryDiscoveryList posts={secondaryPosts} />
        </div>
      )}
    </div>
  );
}

/**
 * SecondaryDiscoveryList.tsx — Up to 5 secondary experience cards.
 *
 * Design rules (PRD §7.3):
 *  - Truncated body preview (2–3 lines max via CSS).
 *  - Single-column editorial layout — no card grid.
 *  - Each links to post detail.
 *  - No card backgrounds, borders only via 1px border-border.
 *  - Author alias at bottom, caption size.
 */
import * as React from 'react';
import Link from 'next/link';
import type { ApiPost } from '../../lib/discoveryApi';
import AvatarSVG from '../common/AvatarSVG';
import { formatCount } from '../../utils/formatCount';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { ROUTES } from '../../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { SECONDARY_DISCOVERY_ITEMS } from '../../constants/limits';

export interface SecondaryDiscoveryListProps {
  posts: ApiPost[];
}

export function SecondaryDiscoveryList({ posts }: SecondaryDiscoveryListProps) {
  // Hard cap at SECONDARY_DISCOVERY_ITEMS (5)
  const visible = posts.slice(0, SECONDARY_DISCOVERY_ITEMS);

  if (visible.length === 0) return null;

  return (
    <section aria-label="More experiences" className="space-y-0">
      <h2 className="sr-only">More experiences from the community</h2>

      {visible.map((post, index) => (
        <SecondaryCard
          key={post.id}
          post={post}
          isLast={index === visible.length - 1}
        />
      ))}
    </section>
  );
}

// ─── SecondaryCard ────────────────────────────────────────────────────────────

interface SecondaryCardProps {
  post:   ApiPost;
  isLast: boolean;
}

function SecondaryCard({ post, isLast }: SecondaryCardProps) {
  const categoryLabel = EXPERIENCE_CATEGORIES.find((c) => c.id === post.categoryIds[0])?.displayName;
  const sameCount     = post.reactionCounts.same;

  return (
    <article
      className={`
        py-8
        ${!isLast ? 'border-b border-[var(--color-border)]' : ''}
      `}
    >
      {/* Category label */}
      {categoryLabel && (
        <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
          {categoryLabel}
        </p>
      )}

      {/* Body preview — 3-line clamp */}
      <Link
        href={ROUTES.POST_DETAIL(post.id)}
        className="group block"
        aria-label={`Read experience: ${post.body.slice(0, 80)}…`}
      >
        <p
          className="
            text-body-lg text-[var(--color-text)] leading-relaxed
            line-clamp-3
            group-hover:text-[var(--color-text)] transition-colors duration-100
          "
        >
          {post.body}
        </p>
      </Link>

      {/* Footer: alias + same count + time */}
      <footer className="flex items-center gap-3 mt-4">
        <AvatarSVG seed={post.authorAvatarSeed} size="sm" aliasName={post.authorAlias} aria-hidden="true" />
        <span className="text-caption text-[var(--color-text-muted)]">
          {post.authorAlias}
        </span>
        {sameCount > 0 && (
          <span
            className="text-caption text-[var(--color-text-muted)]"
            aria-label={`${formatCount(sameCount)} people said SAME`}
          >
            · {formatCount(sameCount)} SAME
          </span>
        )}
        <span className="text-caption text-[var(--color-text-muted)] ml-auto">
          {formatTimeAgo(post.publishedAt)}
        </span>
      </footer>
    </article>
  );
}

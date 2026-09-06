/**
 * ranking.service.ts — Composite post scoring and feed composition engine.
 *
 * Design rules (PRD §12):
 *  - Raw reaction count alone NEVER determines ranking.
 *  - A post with 20,000 reactions must not automatically dominate one with 80 meaningful responses.
 *  - Ranking weights are NEVER hardcoded — loaded from adminConfig at runtime.
 *  - Feed is bounded: 1 primary + up to 5 secondary. No infinite scroll.
 *  - Anti-repeat: posts already reacted to or seen today are excluded entirely.
 *  - Anti-popularity-monopoly: raw counts are log-dampened.
 */
import type { Types } from 'mongoose';
import { PostModel, type IPost } from '../posts/post.model';
import { BlockModel } from '../blocks/block.model';
import { ReactionModel } from '../reactions/reaction.model';
import { getRankingWeights } from './adminConfig.service';
import type { RankingWeights } from './adminConfig.model';
import {
  SECONDARY_DISCOVERY_ITEMS,
  PRIVACY_THRESHOLD_MIN_GROUP_SIZE,
} from '../../constants/limits';
import { POST_STATUS } from '../../constants/postStates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoredPost {
  post:  IPost;
  score: number;
}

export interface RankedFeedResult {
  primary:   IPost | null;
  secondary: IPost[];
}

export interface CategoryFeedResult {
  posts:      IPost[];
  nextCursor: string | null;
}

// ─── Score a single post ──────────────────────────────────────────────────────

/**
 * Compute the composite ranking score for a post given a user's context.
 *
 * Score components (all normalised to [0,1], weighted by admin-configurable weights):
 *  W1 — experience_similarity: fraction of post's categories in user's interests
 *  W2 — recency:               exponential decay by post age (half-life = weights.decayHalfLifeHours)
 *  W3 — quality:               ratio of meaningful secondary reactions to total reactions (log-dampened)
 *  W4 — diversity:             1.0 if post's primary category is underrepresented in user's recent feed
 *  W5 — safety:                penalise posts with content flags
 */
export function scorePost(
  post:             IPost,
  userCategoryIds:  string[],
  recentCategoryIds: string[],
  weights:          RankingWeights
): number {
  const rc = post.reactionCounts;

  // ─── W1: Experience similarity ───────────────────────────────────────────
  const userSet  = new Set(userCategoryIds);
  const matchCount = post.categoryIds.filter((id) => userSet.has(id)).length;
  const similarity = post.categoryIds.length > 0
    ? matchCount / post.categoryIds.length
    : 0;

  // ─── W2: Recency (exponential decay) ────────────────────────────────────
  const ageHours = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
  const halfLife = weights.decayHalfLifeHours > 0 ? weights.decayHalfLifeHours : 24;
  const recency  = Math.pow(0.5, ageHours / halfLife);

  // ─── W3: Meaningful response quality ────────────────────────────────────
  // Meaningful secondaries: iUnderstand, iLearned, tellMeMore (non-generic)
  const meaningful = (rc.iUnderstand ?? 0) + (rc.iLearned ?? 0) + (rc.tellMeMore ?? 0);
  const totalReactions = Object.values(rc).reduce((a, b) => a + (b ?? 0), 0);
  const qualityRatio = totalReactions > 0 ? meaningful / totalReactions : 0;
  // Log-dampen to prevent 20k-reaction posts from monopolising
  const dampedTotal = totalReactions > 0 ? Math.log1p(totalReactions) : 0;
  const quality = qualityRatio * Math.min(1, dampedTotal / Math.log1p(PRIVACY_THRESHOLD_MIN_GROUP_SIZE));

  // ─── W4: Diversity signal ────────────────────────────────────────────────
  // Boost posts in categories underrepresented in the user's recent feed
  const recentCatSet  = new Set(recentCategoryIds);
  const hasNewCategory = post.categoryIds.some((id) => !recentCatSet.has(id));
  const diversity = hasNewCategory ? 1.0 : 0.0;

  // ─── W5: Safety confidence ───────────────────────────────────────────────
  // Penalise posts with flagged content (each flag reduces score)
  const flagPenalty = Math.min(1, (post.contentFlags?.length ?? 0) * 0.25);
  const safety = 1.0 - flagPenalty;

  return (
    weights.w1_similarity * similarity +
    weights.w2_recency    * recency    +
    weights.w3_quality    * quality    +
    weights.w4_diversity  * diversity  +
    weights.w5_safety     * safety
  );
}

// ─── Feed composition ────────────────────────────────────────────────────────

/**
 * Build a ranked home feed for a user.
 *
 * Hard exclusions (applied before scoring):
 *  1. Deleted posts (status ≠ PUBLISHED)
 *  2. Posts from blocked accounts (caller's block list)
 *  3. Posts the user has already reacted to (= seen and engaged)
 *  4. The user's own posts
 *
 * Returns 1 primary + up to SECONDARY_DISCOVERY_ITEMS secondary posts.
 */
export async function getRankedFeed(
  accountId: string,
  opts: { primaryCount?: number; secondaryCount?: number } = {}
): Promise<RankedFeedResult> {
  const primaryCount   = opts.primaryCount   ?? 1;
  const secondaryCount = opts.secondaryCount ?? SECONDARY_DISCOVERY_ITEMS;
  const totalNeeded    = primaryCount + secondaryCount;

  const weights = await getRankingWeights();

  // 1. Get accounts the user has blocked
  const blockedIds = await getBlockedAccountIds(accountId);

  // 2. Get post IDs the user already reacted to (= seen+engaged)
  const reactedPostIds = await getReactedPostIds(accountId);

  // 3. Get user's category interests and recent feed categories
  const { categoryInterests, recentCategoryIds } = await getUserFeedContext(accountId);

  // 4. Query candidate posts — PUBLISHED, not own, not from blocked, not reacted
  const candidates = await PostModel.find({
    status:          POST_STATUS.PUBLISHED,
    deletedAt:       null,
    authorAccountId: {
      $nin: [
        accountId,
        ...blockedIds,
      ],
    },
    _id: { $nin: reactedPostIds },
  })
    .sort({ publishedAt: -1 })
    .limit(100) // Candidate pool cap — score from this set
    .lean<IPost[]>();

  if (candidates.length === 0) {
    return { primary: null, secondary: [] };
  }

  // 5. Score each candidate
  const scored: ScoredPost[] = candidates.map((post) => ({
    post,
    score: scorePost(post as IPost, categoryInterests, recentCategoryIds, weights),
  }));

  // 6. Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // 7. Take top-N
  const top = scored.slice(0, totalNeeded);
  const primary   = top[0]?.post ?? null;
  const secondary = top.slice(1, 1 + secondaryCount).map((s) => s.post);

  return { primary, secondary };
}

/**
 * Category feed — paginated, bounded, reduced ranking (recency + safety + anti-repeat).
 * Not infinite scroll — caller must use cursor-based pagination.
 */
export async function getCategoryFeed(
  accountId:  string,
  categoryId: string,
  opts: { cursor?: string; limit?: number } = {}
): Promise<CategoryFeedResult> {
  const limit = Math.min(opts.limit ?? 20, 50); // Hard max 50 per page

  const blockedIds    = await getBlockedAccountIds(accountId);
  const reactedIds    = await getReactedPostIds(accountId);

  const query: Record<string, unknown> = {
    status:      POST_STATUS.PUBLISHED,
    deletedAt:   null,
    categoryIds: categoryId,
    authorAccountId: {
      $nin: [accountId, ...blockedIds],
    },
    _id: { $nin: reactedIds },
  };

  if (opts.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(opts.cursor, 'base64url').toString('utf-8')) as Record<string, unknown>;
      if (decoded['publishedAt']) {
        query['publishedAt'] = { $lt: new Date(decoded['publishedAt'] as string) };
      }
    } catch {
      // Invalid cursor — ignore, start from beginning
    }
  }

  const posts = await PostModel.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit + 1)
    .lean<IPost[]>();

  const hasMore   = posts.length > limit;
  const pagePosts = hasMore ? posts.slice(0, limit) : posts;
  const last      = pagePosts[pagePosts.length - 1];

  const nextCursor = hasMore && last
    ? Buffer.from(JSON.stringify({ publishedAt: (last as IPost).publishedAt })).toString('base64url')
    : null;

  return { posts: pagePosts as IPost[], nextCursor };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getBlockedAccountIds(accountId: string): Promise<Types.ObjectId[]> {
  const blocks = await BlockModel.find({
    blockerAccountId: accountId,
  })
    .select('blockedAccountId')
    .lean();
  return blocks.map((b) => b.blockedAccountId);
}

async function getReactedPostIds(accountId: string): Promise<Types.ObjectId[]> {
  const reactions = await ReactionModel.find({
    accountId: accountId,
  })
    .select('postId')
    .lean();
  return reactions.map((r) => r.postId);
}

async function getUserFeedContext(accountId: string): Promise<{
  categoryInterests:  string[];
  recentCategoryIds:  string[];
}> {
  // Import here to avoid circular deps
  const { UserModel } = await import('../users/user.model');

  const user = await UserModel.findById(accountId)
    .select('categoryInterests')
    .lean();

  const categoryInterests = user?.categoryInterests ?? [];

  // Recent categories: categories from last 10 reactions the user made
  const recentReactions = await ReactionModel.find({ accountId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate<{ postId: { categoryIds: string[] } }>({ path: 'postId', select: 'categoryIds' })
    .lean();

  const recentCategoryIds = recentReactions
    .flatMap((r) => {
      const p = r.postId as unknown as { categoryIds?: string[] };
      return p?.categoryIds ?? [];
    })
    .slice(0, 20); // Only keep most recent 20

  return { categoryInterests, recentCategoryIds };
}

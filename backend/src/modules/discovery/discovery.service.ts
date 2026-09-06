/**
 * discovery.service.ts — Home feed, category browse, saves, "You Are Not Alone" stats.
 *
 * Privacy invariants:
 *  - YANA stats mask groups below PRIVACY_THRESHOLD_MIN_GROUP_SIZE.
 *  - Saved posts are private — only the owner can access them.
 *  - Similar posts query never exposes authorAccountId.
 */
import { Types } from 'mongoose';
import { PostModel, type IPost } from '../posts/post.model';
import { UserModel } from '../users/user.model';
import { getRankedFeed, getCategoryFeed } from './ranking.service';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { ERR_POST_NOT_FOUND } from '../../constants/errorCodes';
import {
  PRIVACY_THRESHOLD_MIN_GROUP_SIZE,
  MAX_SAVED_POSTS,
} from '../../constants/limits';
import { POST_STATUS } from '../../constants/postStates';
import { EXPERIENCE_CATEGORY_MAP } from '../../constants/experienceCategories';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HomeFeedResult {
  primary:   ReturnType<typeof toPublicPost> | null;
  secondary: ReturnType<typeof toPublicPost>[];
}

export interface CategoryFeedResult {
  posts:      ReturnType<typeof toPublicPost>[];
  nextCursor: string | null;
}

export interface SimilarPostsResult {
  posts: ReturnType<typeof toPublicPost>[];
}

export interface YanaStatEntry {
  categoryId:   string;
  displayName:  string;
  count:        number | null;
  belowThreshold: boolean;
}

export interface YanaStatsResult {
  entries: YanaStatEntry[];
}

// ─── Public serialiser (strips private fields) ───────────────────────────────

function toPublicPost(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  // Privacy — strip internal fields
  delete out['authorAccountId'];
  delete out['moderationNotes'];
  delete out['contentFlags'];
  delete out['__v'];
  // Convert ObjectId to string for _id
  if (out['_id'] && typeof out['_id'] === 'object') {
    out['id'] = String(out['_id']);
    delete out['_id'];
  }
  return out;
}

// ─── Home feed ────────────────────────────────────────────────────────────────

export async function getHomeFeed(accountId: string): Promise<HomeFeedResult> {
  const { primary, secondary } = await getRankedFeed(accountId);

  return {
    primary:   primary ? toPublicPost(primary.toObject?.() ?? { ...(primary as object) }) : null,
    secondary: secondary.map((p) => toPublicPost(p.toObject?.() ?? { ...(p as object) })),
  };
}

// ─── Category feed ────────────────────────────────────────────────────────────

export async function getCategoryFeedPublic(
  accountId:  string,
  categoryId: string,
  opts: { cursor?: string; limit?: number } = {}
): Promise<CategoryFeedResult> {
  const result = await getCategoryFeed(accountId, categoryId, opts);
  return {
    posts:      result.posts.map((p) => toPublicPost((p as unknown as { toObject?: () => Record<string, unknown> }).toObject?.() ?? { ...(p as unknown as Record<string, unknown>) })),
    nextCursor: result.nextCursor,
  };
}

// ─── Similar posts ────────────────────────────────────────────────────────────

/**
 * Get posts in the same category as a given post (for SEO internal linking).
 * Returns up to 5 posts — never the requesting post itself.
 */
export async function getSimilarPosts(
  postId:    string,
  limit = 5
): Promise<SimilarPostsResult> {
  const post = await PostModel.findById(postId as unknown as Types.ObjectId)
    .select('categoryIds status')
    .lean<IPost>();

  if (!post || post.status !== POST_STATUS.PUBLISHED) {
    throw new NotFoundError('Post', ERR_POST_NOT_FOUND);
  }

  const similar = await PostModel.find({
    _id:      { $ne: postId as unknown as Types.ObjectId },
    status:   POST_STATUS.PUBLISHED,
    deletedAt: null,
    categoryIds: { $in: post.categoryIds },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean<IPost[]>();

  return { posts: similar.map((p) => toPublicPost({ ...p })) };
}

// ─── Saves ────────────────────────────────────────────────────────────────────

/**
 * Save a post for the authenticated user.
 * Silently succeeds if already saved (idempotent).
 */
export async function savePost(accountId: string, postId: string): Promise<void> {
  const post = await PostModel.exists({ _id: postId as unknown as Types.ObjectId });
  if (!post) throw new NotFoundError('Post', ERR_POST_NOT_FOUND);

  const user = await UserModel.findById(accountId as unknown as Types.ObjectId)
    .select('savedPostIds')
    .lean<{ savedPostIds?: Types.ObjectId[] }>();

  if (!user) throw new ForbiddenError('ERR_FORBIDDEN');

  const savedCount = (user.savedPostIds ?? []).length;
  if (savedCount >= MAX_SAVED_POSTS) {
    throw new Error(`You can save at most ${MAX_SAVED_POSTS} posts.`);
  }

  await UserModel.findByIdAndUpdate(accountId, {
    $addToSet: { savedPostIds: postId },
  });
}

/**
 * Unsave a post for the authenticated user.
 * Silently succeeds if not saved (idempotent).
 */
export async function unsavePost(accountId: string, postId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(accountId, {
    $pull: { savedPostIds: postId },
  });
}

/**
 * Get the user's saved posts (paginated).
 * Private — only the owner can call this.
 */
export async function getSavedPosts(
  accountId: string,
  opts: { cursor?: string; limit?: number } = {}
): Promise<CategoryFeedResult> {
  const limit = Math.min(opts.limit ?? 20, 50);

  const user = await UserModel.findById(accountId as unknown as Types.ObjectId)
    .select('savedPostIds')
    .lean<{ savedPostIds?: Types.ObjectId[] }>();

  if (!user) throw new ForbiddenError('ERR_FORBIDDEN');

  const savedIds = user.savedPostIds ?? [];

  let filtered = savedIds as Types.ObjectId[];

  if (opts.cursor) {
    try {
      const decoded = JSON.parse(
        Buffer.from(opts.cursor, 'base64url').toString('utf-8')
      ) as { skip?: number };
      const skip = decoded.skip ?? 0;
      filtered   = savedIds.slice(skip);
    } catch {
      // Invalid cursor — start from beginning
    }
  }

  const skip     = savedIds.length - filtered.length;
  const page     = filtered.slice(0, limit);
  const hasMore  = filtered.length > limit;

  const posts = await PostModel.find({
    _id:      { $in: page },
    status:   POST_STATUS.PUBLISHED,
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<IPost[]>();

  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ skip: skip + limit })).toString('base64url')
    : null;

  return {
    posts:      posts.map((p) => toPublicPost({ ...p })),
    nextCursor,
  };
}

// ─── "You Are Not Alone" stats ────────────────────────────────────────────────

/**
 * For each of the user's categoryInterests, count how many OTHER users posted
 * in that category in the last 7 days.
 *
 * Groups below PRIVACY_THRESHOLD_MIN_GROUP_SIZE are masked.
 * Individual user identities are NEVER returned.
 */
export async function getYouAreNotAloneStats(accountId: string): Promise<YanaStatsResult> {
  const user = await UserModel.findById(accountId as unknown as Types.ObjectId)
    .select('categoryInterests')
    .lean<{ categoryInterests?: string[] }>();

  const categories = user?.categoryInterests ?? [];

  const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const entries: YanaStatEntry[] = await Promise.all(
    categories.map(async (categoryId) => {
      // Count DISTINCT authors (not just posts) to reflect unique people
      const distinctAuthors: { _id: Types.ObjectId }[] = await PostModel.aggregate([
        {
          $match: {
            categoryIds:     categoryId,
            status:          POST_STATUS.PUBLISHED,
            publishedAt:     { $gte: SEVEN_DAYS_AGO },
            authorAccountId: { $ne: new Types.ObjectId(accountId) },
            deletedAt:       null,
          },
        },
        {
          $group: { _id: '$authorAccountId' },
        },
      ]);

      const count = distinctAuthors.length;
      const belowThreshold = count < PRIVACY_THRESHOLD_MIN_GROUP_SIZE;
      const catMeta = EXPERIENCE_CATEGORY_MAP[categoryId];

      return {
        categoryId,
        displayName:    catMeta?.displayName ?? categoryId,
        count:          belowThreshold ? null : count,
        belowThreshold,
      };
    })
  );

  return { entries };
}

/**
 * post.service.ts — Business logic for post creation, editing, deletion, retrieval.
 *
 * Privacy invariants:
 *  - `authorAccountId` is NEVER included in any returned object.
 *  - `moderationNotes` and `contentFlags` are NEVER included in returned objects.
 *  - `getPostById` with a deleted/removed post returns redirect metadata only.
 */
import { PostModel, type IPost } from './post.model';
import { scanPost } from '../moderation/contentScanner.service';
import { detectCrisisContent, type CrisisResult } from '../moderation/crisisDetection.service';
import {
  POST_MIN_CHARS,
  POST_MAX_CHARS,
  DAILY_POST_LIMIT,
  POST_EDIT_WINDOW_MS,
} from '../../constants/limits';
import {
  POST_STATUS,
  POST_VISIBILITY,
  type PostStatus,
  type PostExperienceState,
  type PostVisibility,
} from '../../constants/postStates';
import {
  ERR_POST_NOT_FOUND,
  ERR_DAILY_POST_LIMIT,
  ERR_POST_EDIT_WINDOW_EXPIRED,
  ERR_CONTENT_VIOLATION,
} from '../../constants/errorCodes';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
} from '../../utils/errors';
import type { Types } from 'mongoose';
import { decodeCursor, encodeCursor } from '../../utils/pagination';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePostInput {
  readonly body:            string;
  readonly categoryIds:     string[];
  readonly state:           PostExperienceState;
  readonly visibilityScope: PostVisibility;
}

export interface EditPostInput {
  readonly body: string;
}

/** The safe public shape of a post — no internal fields */
export interface PublicPost {
  readonly id:              string;
  readonly body:            string;
  readonly categoryIds:     string[];
  readonly state:           PostExperienceState;
  readonly visibilityScope: PostVisibility;
  readonly status:          PostStatus;
  readonly authorAlias:     string;
  readonly authorAvatarSeed: string;
  readonly publishedAt:     string;
  readonly editableUntil:   string;
  readonly editedAt:        string | null;
  readonly reactionCounts:  IPost['reactionCounts'];
  /** Only present when requested by the author */
  readonly isOwnPost:       boolean;
}

export interface CreatePostResult {
  readonly post:           PublicPost;
  readonly crisisDetected: boolean;
  readonly crisisType:     string | null;
  readonly safetyWarnings: string[];
}

export interface DeletedPostInfo {
  readonly status:           PostStatus;
  readonly redirectCategoryId: string | null;
}

export interface PaginatedPosts {
  readonly posts:      PublicPost[];
  readonly nextCursor: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Create a post.
 * Enforces daily limit, runs content scan, runs crisis detection.
 * Crisis detection never blocks — post is created, flag returned.
 */
export async function createPost(
  authorId: string,
  authorAlias: string,
  authorAvatarSeed: string,
  input: CreatePostInput
): Promise<CreatePostResult> {
  const { body, categoryIds, state, visibilityScope } = input;

  // ─── Validation ──────────────────────────────────────────────────────────
  if (body.length < POST_MIN_CHARS) {
    throw new ValidationError(`Post must be at least ${POST_MIN_CHARS} characters`);
  }
  if (body.length > POST_MAX_CHARS) {
    throw new ValidationError(`Post must not exceed ${POST_MAX_CHARS} characters`);
  }

  // ─── Daily post limit ─────────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await PostModel.countDocuments({
    authorAccountId: authorId,
    publishedAt: { $gte: todayStart },
    status: { $ne: POST_STATUS.DELETED_BY_USER },
  });

  if (todayCount >= DAILY_POST_LIMIT) {
    throw new RateLimitError(ERR_DAILY_POST_LIMIT, 'You have already shared your experience today. Come back tomorrow.');
  }

  // ─── Content scan ─────────────────────────────────────────────────────────
  const scanResult = scanPost(body);

  if (scanResult.hasCriticalViolations) {
    throw new ValidationError(
      'Your post could not be published due to a policy violation.',
      { code: ERR_CONTENT_VIOLATION, patterns: scanResult.detectedPatterns }
    );
  }

  // ─── Crisis detection (runs in parallel conceptually, never blocks) ───────
  let crisisResult: CrisisResult;
  try {
    crisisResult = detectCrisisContent(body);
  } catch {
    // Must never throw — safety net
    crisisResult = { isCrisis: false, crisisType: null };
  }

  // ─── Create post ─────────────────────────────────────────────────────────
  const now          = new Date();
  const editableUntil = new Date(now.getTime() + POST_EDIT_WINDOW_MS);

  const post = new PostModel({
    authorAccountId:  authorId,
    authorAlias,
    authorAvatarSeed,
    body,
    categoryIds:     [...categoryIds],
    state,
    visibilityScope: visibilityScope ?? POST_VISIBILITY.BROAD,
    status:          POST_STATUS.PUBLISHED,
    publishedAt:     now,
    editableUntil,
    contentFlags:    scanResult.detectedPatterns,
  });

  await post.save();

  return {
    post:           toPublicPost(post, true),
    crisisDetected: crisisResult.isCrisis,
    crisisType:     crisisResult.crisisType,
    safetyWarnings: scanResult.detectedPatterns,
  };
}

/**
 * Edit a post.
 * Verifies authorship and edit window.
 */
export async function editPost(
  authorId: string,
  postId:   string,
  input:    EditPostInput
): Promise<PublicPost> {
  const post = await findPublishedPostOrThrow(postId);

  if (String(post.authorAccountId) !== authorId) {
    throw new ForbiddenError('You can only edit your own posts');
  }

  const now = new Date();
  if (now > post.editableUntil) {
    throw new ValidationError('The edit window for this post has closed', { code: ERR_POST_EDIT_WINDOW_EXPIRED });
  }

  if (input.body.length < POST_MIN_CHARS) {
    throw new ValidationError(`Post must be at least ${POST_MIN_CHARS} characters`);
  }
  if (input.body.length > POST_MAX_CHARS) {
    throw new ValidationError(`Post must not exceed ${POST_MAX_CHARS} characters`);
  }

  // Content scan on updated body
  const scanResult = scanPost(input.body);
  if (scanResult.hasCriticalViolations) {
    throw new ValidationError('Post update could not be saved due to a policy violation.', { code: ERR_CONTENT_VIOLATION });
  }

  post.body     = input.body;
  post.editedAt = now;
  post.contentFlags = scanResult.detectedPatterns;
  await post.save();

  return toPublicPost(post, true);
}

/**
 * Soft-delete a post (author only).
 */
export async function deletePost(authorId: string, postId: string): Promise<void> {
  const post = await findPostOrThrow(postId);

  if (String(post.authorAccountId) !== authorId) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  post.status    = POST_STATUS.DELETED_BY_USER;
  post.deletedAt = new Date();
  await post.save();
}

/**
 * Get a single post by ID.
 * Returns public data for published posts.
 * For deleted/removed posts, returns redirect metadata for SEO fallback (FR-SEO-19).
 */
export async function getPostById(
  postId:           string,
  requestingUserId: string | null
): Promise<PublicPost | DeletedPostInfo> {
  const post = await PostModel.findById(postId as unknown as Types.ObjectId).lean();

  if (!post) {
    throw new NotFoundError('Post', ERR_POST_NOT_FOUND);
  }

  // Deleted / removed — return redirect info for SEO soft-404
  if (
    post.status === POST_STATUS.DELETED_BY_USER ||
    post.status === POST_STATUS.REMOVED_BY_MODERATION
  ) {
    return {
      status:             post.status,
      redirectCategoryId: post.categoryIds[0] ?? null,
    };
  }

  const isOwnPost = requestingUserId !== null && String(post.authorAccountId) === requestingUserId;

  return toPublicPostFromLean(post, isOwnPost);
}

/**
 * Get posts by category, cursor-paginated.
 */
export async function getPostsByCategory(
  categoryId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedPosts> {
  const limit = Math.min(options.limit ?? 20, 50);

  const query: Record<string, unknown> = {
    categoryIds: categoryId,
    status:      POST_STATUS.PUBLISHED,
  };

  if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    if (decoded?.publishedAt) {
      query['publishedAt'] = { $lt: new Date(decoded.publishedAt as string) };
    }
  }

  const posts = await PostModel.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore    = posts.length > limit;
  const sliced     = hasMore ? posts.slice(0, limit) : posts;
  const publicPosts = sliced.map((p) => toPublicPostFromLean(p, false));

  const nextCursor = hasMore && sliced.length > 0
    ? encodeCursor({ publishedAt: sliced[sliced.length - 1]?.publishedAt?.toISOString() ?? '' })
    : null;

  return { posts: publicPosts, nextCursor };
}

/**
 * Get the authenticated user's own posts, cursor-paginated.
 */
export async function getPostsByAuthor(
  authorId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedPosts> {
  const limit = Math.min(options.limit ?? 20, 50);

  const query: Record<string, unknown> = {
    authorAccountId: authorId,
    status:          { $ne: POST_STATUS.DELETED_BY_USER },
  };

  if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    if (decoded?.createdAt) {
      query['createdAt'] = { $lt: new Date(decoded.createdAt as string) };
    }
  }

  const posts = await PostModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore    = posts.length > limit;
  const sliced     = hasMore ? posts.slice(0, limit) : posts;
  const publicPosts = sliced.map((p) => toPublicPostFromLean(p, true));

  const nextCursor = hasMore && sliced.length > 0
    ? encodeCursor({ createdAt: sliced[sliced.length - 1]?.createdAt?.toISOString() ?? '' })
    : null;

  return { posts: publicPosts, nextCursor };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function findPublishedPostOrThrow(postId: string): Promise<IPost> {
  const post = await PostModel.findById(postId as unknown as Types.ObjectId);
  if (!post || post.status !== POST_STATUS.PUBLISHED) {
    throw new NotFoundError('Post', ERR_POST_NOT_FOUND);
  }
  return post;
}

async function findPostOrThrow(postId: string): Promise<IPost> {
  const post = await PostModel.findById(postId as unknown as Types.ObjectId);
  if (!post) throw new NotFoundError('Post', ERR_POST_NOT_FOUND);
  return post;
}

/** Convert a Mongoose document to a public-safe object */
function toPublicPost(post: IPost, isOwnPost: boolean): PublicPost {
  return {
    id:              String(post._id),
    body:            post.body,
    categoryIds:     [...post.categoryIds],
    state:           post.state,
    visibilityScope: post.visibilityScope,
    status:          post.status,
    authorAlias:     post.authorAlias,
    authorAvatarSeed: post.authorAvatarSeed,
    publishedAt:     post.publishedAt.toISOString(),
    editableUntil:   post.editableUntil.toISOString(),
    editedAt:        post.editedAt?.toISOString() ?? null,
    reactionCounts:  { ...post.reactionCounts },
    isOwnPost,
  };
}

/** Convert a lean Mongoose result to a public-safe object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublicPostFromLean(post: Record<string, any>, isOwnPost: boolean): PublicPost {
  return {
    id:              String(post._id),
    body:            post.body,
    categoryIds:     [...(post.categoryIds ?? [])],
    state:           post.state,
    visibilityScope: post.visibilityScope,
    status:          post.status,
    authorAlias:     post.authorAlias,
    authorAvatarSeed: post.authorAvatarSeed,
    publishedAt:     post.publishedAt instanceof Date
      ? post.publishedAt.toISOString()
      : String(post.publishedAt),
    editableUntil:   post.editableUntil instanceof Date
      ? post.editableUntil.toISOString()
      : String(post.editableUntil),
    editedAt:        post.editedAt instanceof Date
      ? post.editedAt.toISOString()
      : post.editedAt ? String(post.editedAt) : null,
    reactionCounts:  { ...(post.reactionCounts ?? {}) } as IPost['reactionCounts'],
    isOwnPost,
  };
}


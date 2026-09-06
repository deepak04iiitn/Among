/**
 * post.schema.ts — Zod validation schemas for post routes.
 */
import { z } from 'zod';
import {
  POST_MIN_CHARS,
  POST_MAX_CHARS,
  POST_CATEGORY_MAX,
} from '../../constants/limits';
import {
  POST_EXPERIENCE_STATE,
  POST_VISIBILITY,
} from '../../constants/postStates';

// ─── POST /api/posts ──────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  body: z
    .string()
    .min(POST_MIN_CHARS, `Post must be at least ${POST_MIN_CHARS} characters`)
    .max(POST_MAX_CHARS, `Post must not exceed ${POST_MAX_CHARS} characters`),

  categoryIds: z
    .array(z.string().min(1))
    .max(POST_CATEGORY_MAX, `Select at most ${POST_CATEGORY_MAX} categories`)
    .default([]),

  state: z.enum(
    Object.values(POST_EXPERIENCE_STATE) as [string, ...string[]],
    { errorMap: () => ({ message: 'Invalid experience state' }) }
  ),

  visibilityScope: z.enum(
    Object.values(POST_VISIBILITY) as [string, ...string[]],
    { errorMap: () => ({ message: 'Invalid visibility scope' }) }
  ).default(POST_VISIBILITY.BROAD),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

export const editPostSchema = z.object({
  body: z
    .string()
    .min(POST_MIN_CHARS, `Post must be at least ${POST_MIN_CHARS} characters`)
    .max(POST_MAX_CHARS, `Post must not exceed ${POST_MAX_CHARS} characters`),
});

export type EditPostInput = z.infer<typeof editPostSchema>;

// ─── GET /api/posts (query params) ───────────────────────────────────────────

export const listPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

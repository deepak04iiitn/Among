/**
 * post.routes.ts — Express router for post endpoints.
 *
 * Routes:
 *  POST   /api/posts          → Create post (auth required, onboarding required)
 *  GET    /api/posts/my       → Author's own posts (auth required)
 *  GET    /api/posts/:id      → Get single post (auth optional)
 *  PUT    /api/posts/:id      → Edit post (auth required, must be author)
 *  DELETE /api/posts/:id      → Delete post (auth required, must be author)
 */
import { Router } from 'express';
import * as controller from './post.controller';
import { requireAuth, requireOnboarding, optionalAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createRateLimiter } from '../../middleware/rateLimiter.middleware';
import { createPostSchema, editPostSchema } from './post.schema';

// ─── Rate limiters ────────────────────────────────────────────────────────────

// 5 create-post API calls per minute (the daily limit is enforced in the service)
const postCreateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

export const postsRouter = Router();

// ─── Routes ───────────────────────────────────────────────────────────────────

/** Create a new post */
postsRouter.post(
  '/',
  requireAuth,
  requireOnboarding,
  postCreateLimiter,
  validate(createPostSchema),
  controller.createPost
);

/** Author's own post history — must come before /:id to avoid capture */
postsRouter.get(
  '/my',
  requireAuth,
  requireOnboarding,
  controller.getMyPosts
);

/** Get a single post — auth is optional (public posts are visible to logged-out users) */
postsRouter.get(
  '/:id',
  optionalAuth,
  controller.getPost
);

/** Edit a post */
postsRouter.put(
  '/:id',
  requireAuth,
  requireOnboarding,
  validate(editPostSchema),
  controller.editPost
);

/** Delete a post */
postsRouter.delete(
  '/:id',
  requireAuth,
  requireOnboarding,
  controller.deletePost
);

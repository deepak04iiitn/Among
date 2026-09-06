/**
 * reaction.routes.ts — Express router for reaction endpoints.
 *
 * Routes are nested under /api/posts/:postId/reactions:
 *  PUT    → Set/update reaction (auth required)
 *  DELETE → Remove all reactions (auth required)
 *  GET    → Get aggregate counts + caller's own reaction (auth optional)
 */
import { Router } from 'express';
import * as controller from './reaction.controller';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { reactionRateLimiter } from '../../middleware/rateLimiter.middleware';
import { setReactionSchema } from './reaction.schema';

export const reactionsRouter = Router({ mergeParams: true });

/** Set/update the calling user's reaction */
reactionsRouter.put(
  '/',
  requireAuth,
  reactionRateLimiter,
  validate(setReactionSchema),
  controller.setReaction
);

/** Remove all reactions for the calling user */
reactionsRouter.delete(
  '/',
  requireAuth,
  controller.removeReaction
);

/** Get aggregate counts + calling user's own reaction */
reactionsRouter.get(
  '/',
  optionalAuth,
  controller.getReactions
);

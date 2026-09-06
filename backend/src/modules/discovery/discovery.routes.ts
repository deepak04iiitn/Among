/**
 * discovery.routes.ts — Discovery feed and category browse routes.
 *
 * Routes:
 *  GET  /api/discovery/feed              → Home feed (auth required)
 *  GET  /api/discovery/category/:slug    → Bounded paginated category browse (auth required)
 */
import { Router } from 'express';
import * as controller from './discovery.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { categoryFeedQuerySchema } from './discovery.schema';

export const discoveryRouter = Router();

discoveryRouter.get(
  '/feed',
  requireAuth,
  controller.getHomeFeed
);

discoveryRouter.get(
  '/category/:slug',
  requireAuth,
  validate(categoryFeedQuerySchema, 'query'),
  controller.getCategoryFeed
);

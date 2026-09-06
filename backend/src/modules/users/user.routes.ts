/**
 * user.routes.ts — Express router for auth and user endpoints.
 *
 * Route summary:
 *   POST   /api/auth/session              — Create/resume session (no auth required)
 *   GET    /api/users/me                  — Get private profile (auth required)
 *   POST   /api/users/me/onboarding       — Complete onboarding (auth required)
 *   PUT    /api/users/me/alias/rotate     — Rotate alias (auth + onboarding required)
 *   PUT    /api/users/me/categories       — Update category interests (auth + onboarding required)
 *   GET    /api/users/me/settings         — Get settings bundle (auth required)
 *   PUT    /api/users/me/settings/sny     — Update SNY opt-ins (auth + onboarding required)
 *   POST   /api/users/me/export           — Request data export (auth required)
 *   DELETE /api/users/me                  — Delete account (auth required)
 */
import { Router } from 'express';
import { requireAuth, requireOnboarding } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { aliasRotationRateLimiter } from '../../middleware/rateLimiter.middleware';
import * as controller from './user.controller';
import * as discoveryController from '../discovery/discovery.controller';
import { validate as validateQuery } from '../../middleware/validate.middleware';
import { savedPostsQuerySchema } from '../discovery/discovery.schema';
import {
  createSessionSchema,
  completeOnboardingSchema,
  updateCategoriesSchema,
  updateSnyOptInSchema,
} from './user.schema';

// ─── Auth router (/api/auth) ──────────────────────────────────────────────────

export const authRouter = Router();

authRouter.post(
  '/session',
  validate(createSessionSchema),
  controller.createSession
);

authRouter.post(
  '/refresh',
  controller.refreshSession
);

// ─── Users router (/api/users) ────────────────────────────────────────────────

export const usersRouter = Router();

// All user routes require authentication
usersRouter.use(requireAuth);

usersRouter.get('/me', controller.getMe);

usersRouter.post(
  '/me/onboarding',
  validate(completeOnboardingSchema),
  controller.completeOnboarding
);

usersRouter.put(
  '/me/alias/rotate',
  requireOnboarding,
  aliasRotationRateLimiter,
  controller.rotateAlias
);

usersRouter.put(
  '/me/categories',
  requireOnboarding,
  validate(updateCategoriesSchema),
  controller.updateCategories
);

usersRouter.get('/me/settings', controller.getSettings);

usersRouter.put(
  '/me/settings/sny',
  requireOnboarding,
  validate(updateSnyOptInSchema),
  controller.updateSnyOptIn
);

usersRouter.post('/me/export', controller.requestDataExport);

usersRouter.delete('/me', controller.deleteAccount);

/** Saved posts (paginated) */
usersRouter.get(
  '/me/saved',
  requireOnboarding,
  validateQuery(savedPostsQuerySchema, 'query'),
  discoveryController.getSavedPosts
);

/** "You Are Not Alone" aggregate stats */
usersRouter.get(
  '/me/you-are-not-alone',
  requireOnboarding,
  discoveryController.getYouAreNotAlone
);

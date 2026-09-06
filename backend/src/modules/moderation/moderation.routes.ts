/**
 * moderation.routes.ts — Express routes for reports, blocks, and admin enforcement.
 *
 * Routes:
 *  POST   /api/reports                       Submit a report (auth, rate limited)
 *  GET    /api/users/me/blocks               Get block list (auth)         [registered in user.routes]
 *  POST   /api/users/me/blocks               Block a user (auth)           [registered in user.routes]
 *  DELETE /api/users/me/blocks/:accountId    Unblock (auth)                [registered in user.routes]
 *
 *  GET  /api/admin/reports                   Moderator queue (admin auth)
 *  POST /api/admin/reports/:id/action        Take action (admin auth)
 *  GET  /api/admin/users/:id                 User lookup (admin auth)
 *  POST /api/admin/users/:id/action          Apply enforcement (admin auth)
 */
import { Router } from 'express';
import { requireAuth, requireOnboarding } from '../../middleware/auth.middleware';
import { requireModerator, requireAdmin } from '../../middleware/adminAuth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { reportRateLimiter } from '../../middleware/rateLimiter.middleware';
import * as controller from './moderation.controller';
import {
  submitReportSchema,
  blockUserSchema,
  actionReportSchema,
  adminEnforcementSchema,
} from './moderation.schema';

// ─── User-facing: reports ─────────────────────────────────────────────────────

export const reportsRouter = Router();

reportsRouter.post(
  '/',
  requireAuth,
  requireOnboarding,
  reportRateLimiter,
  validate(submitReportSchema),
  controller.submitReport
);

// ─── User-facing: blocks ──────────────────────────────────────────────────────

export const blocksRouter = Router();

blocksRouter.get(
  '/',
  requireAuth,
  controller.getBlockList
);

blocksRouter.post(
  '/',
  requireAuth,
  requireOnboarding,
  validate(blockUserSchema),
  controller.blockUser
);

blocksRouter.delete(
  '/:accountId',
  requireAuth,
  controller.unblockUser
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

export const adminReportsRouter = Router();

adminReportsRouter.get(
  '/',
  requireModerator,
  controller.getModerationQueue
);

adminReportsRouter.post(
  '/:id/action',
  requireModerator,
  validate(actionReportSchema),
  controller.actionReport
);

export const adminUsersRouter = Router();

adminUsersRouter.get(
  '/:id',
  requireModerator,
  controller.getAdminUserDetail
);

adminUsersRouter.post(
  '/:id/action',
  requireAdmin,
  validate(adminEnforcementSchema),
  controller.applyEnforcementAction
);

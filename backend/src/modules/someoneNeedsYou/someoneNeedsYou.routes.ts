/**
 * someoneNeedsYou.routes.ts — Express routes for SNY and experience graph.
 *
 * Routes:
 *  GET    /api/sny/prompt          Get today's SNY prompt
 *  POST   /api/sny/skip            Skip current prompt, get next
 *  POST   /api/sny/accept          Accept prompt (creates conversation request)
 *  POST   /api/sny/dismiss         Dismiss prompt for today
 *  GET    /api/sny/status          Get daily prompt status
 *  GET    /api/sny/history         Get user's private experience history
 *  PATCH  /api/sny/opt-in          Update SNY opt-in for a category
 */
import { Router } from 'express';
import { requireAuth, requireOnboarding } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as controller from './someoneNeedsYou.controller';
import {
  snyAcceptSchema,
  snySkipSchema,
  snyOptInSchema,
} from './someoneNeedsYou.schema';

export const snyRouter = Router();

snyRouter.get('/prompt',  requireAuth, requireOnboarding, controller.getDailyPrompt);
snyRouter.post('/skip',   requireAuth, requireOnboarding, validate(snySkipSchema),   controller.skipPrompt);
snyRouter.post('/accept', requireAuth, requireOnboarding, validate(snyAcceptSchema), controller.acceptPrompt);
snyRouter.post('/dismiss',requireAuth, controller.dismissPrompt);
snyRouter.get('/status',  requireAuth, controller.getPromptStatus);
snyRouter.get('/history', requireAuth, requireOnboarding, controller.getExperienceHistory);
snyRouter.patch('/opt-in',requireAuth, requireOnboarding, validate(snyOptInSchema),  controller.updateOptIn);

/**
 * adminAnalytics.routes.ts — Admin analytics and config routes.
 * All routes require moderator or admin authentication.
 *
 * GET  /api/admin/analytics/metrics          → Core metrics (WMC, completion, etc.)
 * GET  /api/admin/analytics/safety           → Safety/report rate metrics
 * GET  /api/admin/analytics/categories       → Category breakdown
 * GET  /api/admin/config/ranking-weights     → Get current ranking weights
 * PUT  /api/admin/config/ranking-weights     → Update ranking weights (Admin only)
 * GET  /api/admin/config/rate-limits         → Get current rate limits
 * PUT  /api/admin/config/rate-limits         → Update rate limits (Admin only)
 * GET  /api/admin/config/feature-flags       → Get feature flags
 * PUT  /api/admin/config/feature-flags/:flag → Toggle feature flag (Admin only)
 */
import { Router } from 'express';
import { requireModerator, requireAdmin } from '../../middleware/adminAuth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as controller from './adminAnalytics.controller';
import {
  updateRankingWeightsSchema,
  updateRateLimitsSchema,
  toggleFeatureFlagSchema,
} from './adminAnalytics.schema';

// ─── Analytics ────────────────────────────────────────────────────────────────

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get('/metrics',    requireModerator, controller.getDashboardMetrics);
adminAnalyticsRouter.get('/safety',     requireModerator, controller.getSafetyMetrics);
adminAnalyticsRouter.get('/categories', requireModerator, controller.getCategoryMetrics);

// ─── Config ───────────────────────────────────────────────────────────────────

export const adminConfigRouter = Router();

adminConfigRouter.get(
  '/ranking-weights',
  requireModerator,
  controller.getRankingWeights
);

adminConfigRouter.put(
  '/ranking-weights',
  requireAdmin,
  validate(updateRankingWeightsSchema),
  controller.updateRankingWeights
);

adminConfigRouter.get(
  '/rate-limits',
  requireModerator,
  controller.getRateLimits
);

adminConfigRouter.put(
  '/rate-limits',
  requireAdmin,
  validate(updateRateLimitsSchema),
  controller.updateRateLimits
);

adminConfigRouter.get(
  '/feature-flags',
  requireModerator,
  controller.getFeatureFlags
);

adminConfigRouter.put(
  '/feature-flags/:flag',
  requireAdmin,
  validate(toggleFeatureFlagSchema),
  controller.toggleFeatureFlag
);

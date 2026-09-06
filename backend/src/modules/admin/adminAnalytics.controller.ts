/**
 * adminAnalytics.controller.ts — HTTP handlers for admin analytics and config.
 */
import type { Request, Response, NextFunction } from 'express';
import * as analyticsService from './adminAnalytics.service';
import * as configService    from '../discovery/adminConfig.service';
import type { UpdateRankingWeightsInput, UpdateRateLimitsInput, ToggleFeatureFlagInput } from './adminAnalytics.schema';
import type { FeatureFlag }  from '../../constants/featureFlags';
import type { RankingWeights } from '../discovery/adminConfig.model';

// ─── Analytics endpoints ──────────────────────────────────────────────────────

export async function getDashboardMetrics(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const data = await analyticsService.getDashboardMetrics();
    res.status(200).json(data);
  } catch (err) { next(err); }
}

export async function getSafetyMetrics(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const [reportRate, categoryBreakdown] = await Promise.all([
      analyticsService.getReportRatePer1000(),
      analyticsService.getCategoryBreakdown(),
    ]);
    res.status(200).json({ reportRate, categoryBreakdown });
  } catch (err) { next(err); }
}

export async function getCategoryMetrics(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const breakdown = await analyticsService.getCategoryBreakdown();
    res.status(200).json({ categories: breakdown });
  } catch (err) { next(err); }
}

// ─── Ranking weights ──────────────────────────────────────────────────────────

export async function getRankingWeights(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const weights = await configService.getRankingWeights();
    res.status(200).json({ weights });
  } catch (err) { next(err); }
}

export async function updateRankingWeights(
  req: Request<object, object, UpdateRankingWeightsInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await configService.setRankingWeights(
      req.body as Partial<RankingWeights>,
      req.user!.accountId
    );
    res.status(200).json({ weights: updated });
  } catch (err) { next(err); }
}

// ─── Rate limits ──────────────────────────────────────────────────────────────

export async function getRateLimits(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const limits = await configService.getRateLimits();
    res.status(200).json({ limits });
  } catch (err) { next(err); }
}

export async function updateRateLimits(
  req: Request<object, object, UpdateRateLimitsInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await configService.setRateLimits(req.body as Record<string, number>, req.user!.accountId);
    res.status(200).json({ limits: updated });
  } catch (err) { next(err); }
}

// ─── Feature flags ────────────────────────────────────────────────────────────

export async function getFeatureFlags(
  _req: Request, res: Response, next: NextFunction
): Promise<void> {
  try {
    const flags = await configService.getFeatureFlags();
    res.status(200).json({ flags });
  } catch (err) { next(err); }
}

export async function toggleFeatureFlag(
  req: Request<{ flag: string }, object, ToggleFeatureFlagInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await configService.toggleFeatureFlag(
      req.params.flag as FeatureFlag,
      req.body.enabled,
      req.user!.accountId
    );
    res.status(200).json({ flags: updated });
  } catch (err) { next(err); }
}

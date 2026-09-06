/**
 * adminAnalytics.schema.ts — Zod validation for admin analytics/config endpoints.
 */
import { z } from 'zod';

export const updateRankingWeightsSchema = z.object({
  w1_similarity:      z.number().min(0).max(1).optional(),
  w2_recency:         z.number().min(0).max(1).optional(),
  w3_quality:         z.number().min(0).max(1).optional(),
  w4_diversity:       z.number().min(0).max(1).optional(),
  w5_safety:          z.number().min(0).max(1).optional(),
  decayHalfLifeHours: z.number().min(1).optional(),
}).refine((val) => Object.keys(val).length > 0, {
  message: 'At least one weight must be provided',
});

export type UpdateRankingWeightsInput = z.infer<typeof updateRankingWeightsSchema>;

export const updateRateLimitsSchema = z.object({
  postsPerDay:          z.number().int().positive().optional(),
  reactionsPerMinute:   z.number().int().positive().optional(),
  reportsPerHour:       z.number().int().positive().optional(),
  aliasRotationsPerDay: z.number().int().positive().optional(),
}).refine((val) => Object.keys(val).length > 0, {
  message: 'At least one limit must be provided',
});

export type UpdateRateLimitsInput = z.infer<typeof updateRateLimitsSchema>;

export const toggleFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

export type ToggleFeatureFlagInput = z.infer<typeof toggleFeatureFlagSchema>;

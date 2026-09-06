/**
 * adminConfig.service.ts — Runtime-configurable admin settings.
 *
 * Ranking weights, rate limits, and feature flags are loaded from the
 * AdminConfig collection and cached in memory with a short TTL. This means:
 *  - No code deploy required to change weights or toggle flags.
 *  - A short cache miss window (configurable TTL) keeps DB load low.
 *  - Falls back to safe defaults if no config is found in DB.
 */
import { AdminConfigModel, DEFAULT_RANKING_WEIGHTS, type RankingWeights } from './adminConfig.model';
import type { FeatureFlag } from '../../constants/featureFlags';

// ─── Config keys (never hardcoded outside this file) ─────────────────────────

export const CONFIG_KEYS = {
  RANKING_WEIGHTS: 'ranking_weights',
  RATE_LIMITS:     'rate_limits',
  FEATURE_FLAGS:   'feature_flags',
} as const;

// ─── In-memory TTL cache ──────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache

interface CacheEntry<T> {
  value:     T;
  expiresAt: number;
}

const configCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = configCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    configCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCache<T>(key: string, value: T): void {
  configCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Clear cache — used in tests and after admin updates */
export function clearConfigCache(): void {
  configCache.clear();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load ranking weights from DB (or cache).
 * Returns DEFAULT_RANKING_WEIGHTS if no config is found.
 */
export async function getRankingWeights(): Promise<RankingWeights> {
  const cached = getCached<RankingWeights>(CONFIG_KEYS.RANKING_WEIGHTS);
  if (cached) return cached;

  const doc = await AdminConfigModel.findOne({ key: CONFIG_KEYS.RANKING_WEIGHTS }).lean();
  const weights: RankingWeights = doc?.value
    ? { ...DEFAULT_RANKING_WEIGHTS, ...(doc.value as Partial<RankingWeights>) }
    : { ...DEFAULT_RANKING_WEIGHTS };

  setCache(CONFIG_KEYS.RANKING_WEIGHTS, weights);
  return weights;
}

/**
 * Persist new ranking weights to DB and bust the cache.
 * Validates that all weights sum to 1.0 before persisting.
 * Only called from admin dashboard.
 */
export async function setRankingWeights(
  weights:   Partial<RankingWeights>,
  updatedBy: string
): Promise<RankingWeights> {
  const current = await getRankingWeights();
  const merged: RankingWeights = { ...current, ...weights };

  // Validate sum ≈ 1.0 (exclude non-weight fields like decayHalfLifeHours)
  const weightKeys = ['w1_similarity', 'w2_recency', 'w3_quality', 'w4_diversity', 'w5_safety'] as const;
  const sum = weightKeys.reduce((a, k) => a + (merged[k] ?? 0), 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error(`Ranking weights must sum to 1.0 (got ${sum.toFixed(4)})`);
  }

  await AdminConfigModel.findOneAndUpdate(
    { key: CONFIG_KEYS.RANKING_WEIGHTS },
    { value: merged, updatedBy },
    { upsert: true, new: true }
  );

  clearConfigCache();
  return merged;
}

// ─── Rate limits ──────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  postsPerDay:         number;
  reactionsPerMinute:  number;
  reportsPerHour:      number;
  aliasRotationsPerDay: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  postsPerDay:          3,
  reactionsPerMinute:  30,
  reportsPerHour:      10,
  aliasRotationsPerDay: 1,
};

export async function getRateLimits(): Promise<RateLimitConfig> {
  const cached = getCached<RateLimitConfig>(CONFIG_KEYS.RATE_LIMITS);
  if (cached) return cached;

  const doc = await AdminConfigModel.findOne({ key: CONFIG_KEYS.RATE_LIMITS }).lean();
  const limits: RateLimitConfig = doc?.value
    ? { ...DEFAULT_RATE_LIMITS, ...(doc.value as Partial<RateLimitConfig>) }
    : { ...DEFAULT_RATE_LIMITS };

  setCache(CONFIG_KEYS.RATE_LIMITS, limits);
  return limits;
}

export async function setRateLimits(
  limits:    Partial<RateLimitConfig> | Record<string, number>,
  updatedBy: string
): Promise<RateLimitConfig> {
  const current = await getRateLimits();
  const merged  = { ...current, ...limits };

  await AdminConfigModel.findOneAndUpdate(
    { key: CONFIG_KEYS.RATE_LIMITS },
    { value: merged, updatedBy },
    { upsert: true, new: true }
  );

  clearConfigCache();
  return merged;
}

// ─── Feature flags ────────────────────────────────────────────────────────────

export type FeatureFlagMap = Record<FeatureFlag, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = {
  someoneNeedsYou:     false,
  subscriptionSurfaces: false,
  experienceGraphView:  false,
  geographicAggregates: false,
  indexPostPages:       false,
} as unknown as FeatureFlagMap;

export async function getFeatureFlags(): Promise<FeatureFlagMap> {
  const cached = getCached<FeatureFlagMap>(CONFIG_KEYS.FEATURE_FLAGS);
  if (cached) return cached;

  const doc = await AdminConfigModel.findOne({ key: CONFIG_KEYS.FEATURE_FLAGS }).lean();
  const flags: FeatureFlagMap = doc?.value
    ? { ...DEFAULT_FEATURE_FLAGS, ...(doc.value as Partial<FeatureFlagMap>) }
    : { ...DEFAULT_FEATURE_FLAGS };

  setCache(CONFIG_KEYS.FEATURE_FLAGS, flags);
  return flags;
}

export async function toggleFeatureFlag(
  flag:      FeatureFlag,
  enabled:   boolean,
  updatedBy: string
): Promise<FeatureFlagMap> {
  const current = await getFeatureFlags();
  const updated = { ...current, [flag]: enabled };

  await AdminConfigModel.findOneAndUpdate(
    { key: CONFIG_KEYS.FEATURE_FLAGS },
    { value: updated, updatedBy },
    { upsert: true, new: true }
  );

  clearConfigCache();
  return updated;
}

/**
 * adminConfig.service.ts — Runtime-configurable admin settings.
 *
 * Ranking weights and other config values are loaded from the AdminConfig
 * collection and cached in memory with a short TTL. This means:
 *  - No code deploy required to change weights.
 *  - A short cache miss window (configurable TTL) keeps DB load low.
 *  - Falls back to DEFAULT_RANKING_WEIGHTS if no config is found in DB.
 */
import { AdminConfigModel, DEFAULT_RANKING_WEIGHTS, type RankingWeights } from './adminConfig.model';

// ─── Config keys (never hardcoded outside this file) ─────────────────────────

export const CONFIG_KEYS = {
  RANKING_WEIGHTS: 'ranking_weights',
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
 * Only called from admin dashboard.
 */
export async function setRankingWeights(
  weights:   Partial<RankingWeights>,
  updatedBy: string
): Promise<RankingWeights> {
  const current = await getRankingWeights();
  const merged: RankingWeights = { ...current, ...weights };

  await AdminConfigModel.findOneAndUpdate(
    { key: CONFIG_KEYS.RANKING_WEIGHTS },
    { value: merged, updatedBy },
    { upsert: true, new: true }
  );

  clearConfigCache();
  return merged;
}

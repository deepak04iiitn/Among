/**
 * adminApi.ts — Frontend API client for the admin dashboard.
 *
 * All requests include the Firebase ID token (via apiClient interceptor).
 * Admin-only: role check is also enforced server-side.
 */
import { apiClient } from './apiClient';
import { API } from '../constants/apiEndpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  wmc:        { weeklyMeaningfulConnections: number; periodStart: string; periodEnd: string };
  completion: { rate: number; active: number; total: number };
  reportRate: { ratePer1000: number; totalReports: number; totalContent: number };
  sny:        { rate: number; optedInUsers: number; eligibleUsers: number };
}

export interface CategoryBreakdownItem {
  categoryId:  string;
  postVolume:  number;
  reportCount: number;
  reportRate:  number;
}

export interface SafetyMetrics {
  reportRate:       { ratePer1000: number; totalReports: number; totalContent: number };
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface RankingWeights {
  w1_similarity:      number;
  w2_recency:         number;
  w3_quality:         number;
  w4_diversity:       number;
  w5_safety:          number;
  decayHalfLifeHours: number;
}

export interface RateLimits {
  postsPerDay:          number;
  reactionsPerMinute:   number;
  reportsPerHour:       number;
  aliasRotationsPerDay: number;
}

export type FeatureFlagMap = Record<string, boolean>;

// ─── Admin report types ───────────────────────────────────────────────────────

export interface AdminReport {
  id:                  string;
  reportedContentType: string;
  reportedContentId:   string;
  reason:              string;
  severity:            string;
  status:              string;
  isCrisisFlagged:     boolean;
  createdAt:           string;
  /** Reporter identity never included — privacy invariant */
}

export interface AdminUser {
  id:                     string;
  alias:                  string;
  createdAt:              string;
  hasCompletedOnboarding: boolean;
  enforcementStatus?:     unknown;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await apiClient.get<DashboardMetrics>(API.ADMIN_METRICS);
  return res.data;
}

export async function fetchSafetyMetrics(): Promise<SafetyMetrics> {
  const res = await apiClient.get<SafetyMetrics>(API.ADMIN_SAFETY_METRICS);
  return res.data;
}

export async function fetchCategoryMetrics(): Promise<{ categories: CategoryBreakdownItem[] }> {
  const res = await apiClient.get<{ categories: CategoryBreakdownItem[] }>(API.ADMIN_CATEGORY_METRICS);
  return res.data;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function fetchReportQueue(cursor?: string): Promise<{ reports: AdminReport[]; cursor: string | null }> {
  const res = await apiClient.get<{ reports: AdminReport[]; cursor: string | null }>(
    API.ADMIN_REPORTS,
    { params: cursor ? { cursor } : {} }
  );
  return res.data;
}

export async function fetchReportDetail(id: string): Promise<AdminReport> {
  const res = await apiClient.get<AdminReport>(API.ADMIN_REPORT(id));
  return res.data;
}

export async function actionReport(
  id:      string,
  action:  string,
  notes?:  string
): Promise<void> {
  await apiClient.post(API.ADMIN_REPORT_ACTION(id), { action, notes });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchAdminUser(id: string): Promise<AdminUser> {
  const res = await apiClient.get<AdminUser>(API.ADMIN_USER(id));
  return res.data;
}

export async function adminUserAction(id: string, action: string, notes?: string): Promise<void> {
  await apiClient.post(API.ADMIN_USER_ACTION(id), { action, notes });
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function fetchRankingWeights(): Promise<RankingWeights> {
  const res = await apiClient.get<{ weights: RankingWeights }>(API.ADMIN_CONFIG_RANKING);
  return res.data.weights;
}

export async function updateRankingWeights(weights: Partial<RankingWeights>): Promise<RankingWeights> {
  const res = await apiClient.put<{ weights: RankingWeights }>(API.ADMIN_CONFIG_RANKING, weights);
  return res.data.weights;
}

export async function fetchRateLimits(): Promise<RateLimits> {
  const res = await apiClient.get<{ limits: RateLimits }>(API.ADMIN_CONFIG_RATE_LIMITS);
  return res.data.limits;
}

export async function updateRateLimits(limits: Partial<RateLimits>): Promise<RateLimits> {
  const res = await apiClient.put<{ limits: RateLimits }>(API.ADMIN_CONFIG_RATE_LIMITS, limits);
  return res.data.limits;
}

export async function fetchFeatureFlags(): Promise<FeatureFlagMap> {
  const res = await apiClient.get<{ flags: FeatureFlagMap }>(API.ADMIN_CONFIG_FLAGS);
  return res.data.flags;
}

export async function toggleFeatureFlag(flag: string, enabled: boolean): Promise<FeatureFlagMap> {
  const res = await apiClient.put<{ flags: FeatureFlagMap }>(
    API.ADMIN_CONFIG_FLAG(flag),
    { enabled }
  );
  return res.data.flags;
}

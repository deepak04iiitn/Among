/**
 * adminAnalytics.service.ts — Core product metrics for the admin dashboard.
 *
 * North-star metric: Weekly Meaningful Connections (WMC).
 * All analytics are read-only aggregations — never expose individual user data.
 *
 * Analytics rules (PRD §18):
 *  - Never block user-facing requests (fire-and-forget where needed).
 *  - Never include Firebase UID, email, raw account ID, or message body content.
 */
import { ConversationModel } from '../conversations/conversation.model';
import { PostModel }         from '../posts/post.model';
import { ReportModel }       from '../moderation/report.model';
import { UserModel }         from '../users/user.model';
import { CONVERSATION_STATE } from '../../constants/conversationStates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WMCMetric {
  weeklyMeaningfulConnections: number;
  periodStart:                 string;
  periodEnd:                   string;
}

export interface RetentionMetrics {
  d1:  number; // % users who returned day 1
  d7:  number; // % users who returned day 7
  d30: number; // % users who returned day 30
}

export interface ConversationCompletionRate {
  rate:     number; // 0–1
  active:   number;
  total:    number;
}

export interface ReportRateMetric {
  ratePer1000:   number;
  totalReports:  number;
  totalContent:  number;
}

export interface SnyOptInRateMetric {
  rate:          number; // 0–1
  optedInUsers:  number;
  eligibleUsers: number;
}

export interface TimeToFirstPostMetric {
  medianHours: number;
}

export interface CategoryBreakdownItem {
  categoryId:  string;
  postVolume:  number;
  reportCount: number;
  reportRate:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Weekly Meaningful Connections — conversations that reached ACTIVE state in last 7 days.
 * This is the north-star metric (PRD §1).
 */
export async function getWeeklyMeaningfulConnections(): Promise<WMCMetric> {
  const periodStart = daysAgo(7);
  const periodEnd   = new Date();

  const count = await ConversationModel.countDocuments({
    state:     { $in: [CONVERSATION_STATE.ACTIVE, ...Object.values(CONVERSATION_STATE).filter((s) => s.startsWith('ended_'))] },
    createdAt: { $gte: periodStart, $lte: periodEnd },
  });

  return {
    weeklyMeaningfulConnections: count,
    periodStart:                 periodStart.toISOString(),
    periodEnd:                   periodEnd.toISOString(),
  };
}

/**
 * Retention metrics — D1/D7/D30 re-engagement rates.
 * Approximated by checking users who posted or reacted in each time window
 * (full cohort-based retention requires event tracking from Phase 13).
 */
export async function getRetentionMetrics(): Promise<RetentionMetrics> {
  const now   = Date.now();

  const [total, d1, d7, d30] = await Promise.all([
    // Total users who joined > 30 days ago (cohort base)
    UserModel.countDocuments({ createdAt: { $lte: new Date(now - 30 * 86400_000) }, deletedAt: null }),
    // D1: posted or reacted within 1 day of joining (approximation)
    PostModel.countDocuments({ publishedAt: { $gte: new Date(now - 86400_000), $lte: new Date(now) } }),
    PostModel.countDocuments({ publishedAt: { $gte: new Date(now - 7 * 86400_000), $lte: new Date(now) } }),
    PostModel.countDocuments({ publishedAt: { $gte: new Date(now - 30 * 86400_000), $lte: new Date(now) } }),
  ]);

  const base = Math.max(total, 1);

  return {
    d1:  Math.min(1, d1 / base),
    d7:  Math.min(1, d7 / base),
    d30: Math.min(1, d30 / base),
  };
}

/**
 * Conversation completion rate — ratio of conversations that became ACTIVE vs total matched.
 */
export async function getConversationCompletionRate(): Promise<ConversationCompletionRate> {
  const since = daysAgo(7);

  const [active, total] = await Promise.all([
    ConversationModel.countDocuments({
      state:     { $ne: CONVERSATION_STATE.REQUESTED },
      createdAt: { $gte: since },
    }),
    ConversationModel.countDocuments({ createdAt: { $gte: since } }),
  ]);

  return {
    rate:   total > 0 ? active / total : 0,
    active,
    total,
  };
}

/**
 * Report rate per 1,000 content items in the last 7 days.
 */
export async function getReportRatePer1000(): Promise<ReportRateMetric> {
  const since = daysAgo(7);

  const [totalReports, totalPosts] = await Promise.all([
    ReportModel.countDocuments({ createdAt: { $gte: since } }),
    PostModel.countDocuments({   publishedAt: { $gte: since } }),
  ]);

  const totalContent = totalPosts; // messages would be added here when MessageModel is available
  const ratePer1000  = totalContent > 0
    ? (totalReports / totalContent) * 1000
    : 0;

  return { ratePer1000, totalReports, totalContent };
}

/**
 * SNY opt-in rate — % of eligible users (completed onboarding) with at least one SNY opt-in.
 */
export async function getSnyOptInRate(): Promise<SnyOptInRateMetric> {
  const [eligibleUsers, optedInUsers] = await Promise.all([
    UserModel.countDocuments({ hasCompletedOnboarding: true, deletedAt: null }),
    UserModel.countDocuments({
      hasCompletedOnboarding: true,
      deletedAt:              null,
      snyOptIns:              { $exists: true, $not: { $size: 0 } },
    }),
  ]);

  return {
    rate:         eligibleUsers > 0 ? optedInUsers / eligibleUsers : 0,
    optedInUsers,
    eligibleUsers,
  };
}

/**
 * Median time from account creation to first post (hours).
 */
export async function getTimeToFirstPost(): Promise<TimeToFirstPostMetric> {
  // Aggregate: join users and their earliest post, compute diff
  const result = await PostModel.aggregate([
    { $sort: { publishedAt: 1 } },
    {
      $group: {
        _id:          '$accountId',
        firstPostAt:  { $first: '$publishedAt' },
      },
    },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        diffMs: {
          $subtract: ['$firstPostAt', '$user.createdAt'],
        },
      },
    },
    { $sort: { diffMs: 1 } },
  ]);

  if (result.length === 0) return { medianHours: 0 };

  const mid       = Math.floor(result.length / 2);
  const medianMs  = (result[mid] as { diffMs: number }).diffMs ?? 0;
  const medianHrs = medianMs / (1000 * 60 * 60);

  return { medianHours: Math.max(0, medianHrs) };
}

/**
 * Category breakdown — post volume and report rate per experience category.
 */
export async function getCategoryBreakdown(): Promise<CategoryBreakdownItem[]> {
  const since = daysAgo(7);

  const [postsByCategory, reportsByCategory] = await Promise.all([
    PostModel.aggregate([
      { $match: { publishedAt: { $gte: since } } },
      { $unwind: '$categoryIds' },
      { $group: { _id: '$categoryIds', postVolume: { $sum: 1 } } },
    ]),
    ReportModel.aggregate([
      { $match: { createdAt: { $gte: since }, reportedContentType: 'post' } },
      // Join to get category info from the reported post
      {
        $lookup: {
          from:         'posts',
          localField:   'reportedContentId',
          foreignField: '_id',
          as:           'post',
        },
      },
      { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$post.categoryIds', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$post.categoryIds', reportCount: { $sum: 1 } } },
    ]),
  ]);

  const reportMap = new Map(
    reportsByCategory.map((r: { _id: string; reportCount: number }) => [r._id, r.reportCount])
  );

  return postsByCategory.map((p: { _id: string; postVolume: number }) => {
    const reportCount = reportMap.get(p._id) ?? 0;
    return {
      categoryId:  p._id,
      postVolume:  p.postVolume,
      reportCount,
      reportRate:  p.postVolume > 0 ? reportCount / p.postVolume : 0,
    };
  });
}

/**
 * Aggregate metrics for the main dashboard.
 */
export async function getDashboardMetrics() {
  const [wmc, completion, reportRate, sny] = await Promise.all([
    getWeeklyMeaningfulConnections(),
    getConversationCompletionRate(),
    getReportRatePer1000(),
    getSnyOptInRate(),
  ]);
  return { wmc, completion, reportRate, sny };
}

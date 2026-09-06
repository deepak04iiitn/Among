/**
 * analytics.service.ts — Event emission and metric computation.
 *
 * Architecture rules (PRD §18):
 *  - Product code emits events; analytics subscribes. Never the reverse.
 *  - Analytics never blocks user-facing requests (all writes are async, fire-and-forget).
 *  - accountIdHash uses HMAC-SHA256 — never the raw account ID.
 *  - Events never contain: Firebase UID, email, raw accountId, message body, alias.
 *
 * Metric computations read from the AnalyticsEvent collection — they are
 * separated from Phase 11's admin analytics (which reads from source collections)
 * to demonstrate the event-bus architecture. Over time these should converge.
 */
import crypto  from 'crypto';
import { AnalyticsEventModel }           from './analyticsEvent.model';
import type { AnalyticsEventType }       from '../../constants/analyticsEvents';

// ─── HMAC helper ─────────────────────────────────────────────────────────────

const HMAC_SECRET = process.env['ANALYTICS_HMAC_SECRET'] ?? 'analytics-hmac-secret-dev';

/**
 * Hash an accountId for analytics.
 * Returns a deterministic HMAC-SHA256 hex string.
 * The raw accountId is never stored — PRD §18.
 */
export function hashAccountId(accountId: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(accountId)
    .digest('hex');
}

// ─── Event emission ───────────────────────────────────────────────────────────

export interface EmitEventInput {
  eventType:          AnalyticsEventType;
  accountId:          string;
  sessionId?:         string | undefined;
  categoryId?:        string | undefined;
  conversationState?: string | undefined;
  /** Non-identifying context — no content body, no PII */
  metadata?:          Record<string, unknown> | undefined;
}

/**
 * Emit an analytics event — fire-and-forget.
 * Never throws; never awaited in product code.
 * The returned Promise is intentionally not awaited at call sites.
 */
export function emitEvent(input: EmitEventInput): void {
  const accountIdHash = hashAccountId(input.accountId);
  const sessionId     = input.sessionId ?? `anon-${accountIdHash.slice(0, 8)}`;

  AnalyticsEventModel.create({
    eventType:         input.eventType,
    accountIdHash,
    sessionId,
    categoryId:        input.categoryId,
    conversationState: input.conversationState,
    timestamp:         new Date(),
    metadata:          input.metadata ?? {},
  }).catch((err: unknown) => {
    // Analytics must never crash product code — swallow and log only
    console.error('[analytics] event write failed:', err);
  });
}

// ─── Metric computations ──────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Weekly Meaningful Connections — CONVERSATION_STARTED events in last 7 days */
export async function computeWMC(): Promise<number> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  return AnalyticsEventModel.countDocuments({
    eventType: ANALYTICS_EVENT.CONVERSATION_STARTED,
    timestamp: { $gte: daysAgo(7) },
  });
}

/** Conversation start rate — CONVERSATION_STARTED / CONVERSATION_MATCHED */
export async function computeConversationStartRate(): Promise<{
  rate:    number;
  started: number;
  matched: number;
}> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  const since = daysAgo(7);
  const [started, matched] = await Promise.all([
    AnalyticsEventModel.countDocuments({ eventType: ANALYTICS_EVENT.CONVERSATION_STARTED, timestamp: { $gte: since } }),
    AnalyticsEventModel.countDocuments({ eventType: ANALYTICS_EVENT.CONVERSATION_MATCHED, timestamp: { $gte: since } }),
  ]);
  return { rate: matched > 0 ? started / matched : 0, started, matched };
}

/** Report rate per 1,000 interactions */
export async function computeReportRate(): Promise<{
  ratePer1000:  number;
  totalReports: number;
  totalPosts:   number;
}> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  const since = daysAgo(7);
  const [totalReports, totalPosts] = await Promise.all([
    AnalyticsEventModel.countDocuments({ eventType: ANALYTICS_EVENT.REPORT_SUBMITTED, timestamp: { $gte: since } }),
    AnalyticsEventModel.countDocuments({ eventType: ANALYTICS_EVENT.POST_CREATED,     timestamp: { $gte: since } }),
  ]);
  const ratePer1000 = totalPosts > 0 ? (totalReports / totalPosts) * 1000 : 0;
  return { ratePer1000, totalReports, totalPosts };
}

/** Time to first post — median ms between USER_CREATED and FIRST_POST_CREATED */
export async function computeTimeToFirstPost(): Promise<{ medianHours: number }> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  const since = daysAgo(30);

  // Find pairs of USER_CREATED + FIRST_POST_CREATED per user
  const result = await AnalyticsEventModel.aggregate([
    {
      $match: {
        eventType: { $in: [ANALYTICS_EVENT.USER_CREATED, ANALYTICS_EVENT.FIRST_POST_CREATED] },
        timestamp: { $gte: since },
      },
    },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id:       '$accountIdHash',
        events:    { $push: { type: '$eventType', ts: '$timestamp' } },
      },
    },
  ]);

  const diffs: number[] = [];
  for (const row of result as Array<{ _id: string; events: Array<{ type: string; ts: Date }> }>) {
    const created  = row.events.find((e) => e.type === 'user_created');
    const firstPost = row.events.find((e) => e.type === 'first_post_created');
    if (created && firstPost) {
      const diffMs = new Date(firstPost.ts).getTime() - new Date(created.ts).getTime();
      if (diffMs >= 0) diffs.push(diffMs);
    }
  }

  if (diffs.length === 0) return { medianHours: 0 };
  diffs.sort((a, b) => a - b);
  const midMs = diffs[Math.floor(diffs.length / 2)]!;
  return { medianHours: midMs / (1000 * 60 * 60) };
}

/** D1/D7/D30 retention — % of cohort who had any event on day N ± 1 */
export async function computeRetention(): Promise<{ d1: number; d7: number; d30: number }> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  const now = Date.now();

  // Cohort: users created more than 30 days ago
  const cohortStart = new Date(now - 60 * 86400_000);
  const cohortEnd   = new Date(now - 30 * 86400_000);

  const cohortHashes = await AnalyticsEventModel.distinct('accountIdHash', {
    eventType: ANALYTICS_EVENT.USER_CREATED,
    timestamp: { $gte: cohortStart, $lte: cohortEnd },
  }) as string[];

  if (cohortHashes.length === 0) return { d1: 0, d7: 0, d30: 0 };
  const base = cohortHashes.length;

  const windowCount = async (daysAfterCreation: number): Promise<number> => {
    const windowStart = new Date(now - (daysAfterCreation + 1) * 86400_000);
    const windowEnd   = new Date(now - (daysAfterCreation - 1) * 86400_000);
    const active = await AnalyticsEventModel.distinct('accountIdHash', {
      accountIdHash: { $in: cohortHashes },
      timestamp:     { $gte: windowStart, $lte: windowEnd },
    });
    return (active as string[]).length;
  };

  const [d1Count, d7Count, d30Count] = await Promise.all([
    windowCount(1),
    windowCount(7),
    windowCount(30),
  ]);

  return {
    d1:  d1Count  / base,
    d7:  d7Count  / base,
    d30: d30Count / base,
  };
}

/** Posts per active user */
export async function computePostsPerActiveUser(): Promise<number> {
  const { ANALYTICS_EVENT } = await import('../../constants/analyticsEvents');
  const since = daysAgo(7);
  const [totalPosts, distinctUsers] = await Promise.all([
    AnalyticsEventModel.countDocuments({ eventType: ANALYTICS_EVENT.POST_CREATED, timestamp: { $gte: since } }),
    AnalyticsEventModel.distinct('accountIdHash', { timestamp: { $gte: since } }),
  ]);
  const activeUsers = (distinctUsers as string[]).length;
  return activeUsers > 0 ? totalPosts / activeUsers : 0;
}

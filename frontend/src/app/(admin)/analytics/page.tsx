/**
 * /admin/analytics — Core metrics dashboard.
 *
 * Displays:
 *  - Weekly Meaningful Connections (north-star metric)
 *  - Conversation completion rate
 *  - Report rate per 1,000 content items
 *  - SNY opt-in rate
 *
 * Safety metrics are shown separately (report rate, category breakdown).
 */
'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardMetrics, fetchSafetyMetrics, type DashboardMetrics, type SafetyMetrics } from '../../../lib/adminApi';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly sub?:  string;
}) {
  return (
    <div className="border border-border rounded-radius-md p-6">
      <dt className="text-caption text-text-muted uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-title-xl font-editorial text-text">{value}</dd>
      {sub && <p className="text-caption text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics]       = useState<DashboardMetrics | null>(null);
  const [safety,  setSafety]        = useState<SafetyMetrics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDashboardMetrics(), fetchSafetyMetrics()])
      .then(([m, s]) => { setMetrics(m); setSafety(s); })
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ui text-text-muted" aria-live="polite">Loading analytics…</p>;
  if (error)   return <p className="text-ui text-red-600" role="alert">{error}</p>;
  if (!metrics || !safety) return null;

  return (
    <div>
      <h1 className="text-title font-editorial mb-8">Analytics</h1>

      {/* North-star + core metrics */}
      <section aria-labelledby="core-metrics-heading" className="mb-10">
        <h2 id="core-metrics-heading" className="text-ui font-medium text-text mb-4 uppercase tracking-wide text-sm">
          Core Metrics — Last 7 days
        </h2>
        <dl className="grid grid-cols-2 gap-4">
          <StatCard
            label="Weekly Meaningful Connections"
            value={metrics.wmc.weeklyMeaningfulConnections}
            sub="North-star metric"
          />
          <StatCard
            label="Conversation completion rate"
            value={`${(metrics.completion.rate * 100).toFixed(1)}%`}
            sub={`${metrics.completion.active} active / ${metrics.completion.total} total`}
          />
          <StatCard
            label="Report rate per 1,000"
            value={metrics.reportRate.ratePer1000.toFixed(2)}
            sub={`${metrics.reportRate.totalReports} reports / ${metrics.reportRate.totalContent} items`}
          />
          <StatCard
            label="SNY opt-in rate"
            value={`${(metrics.sny.rate * 100).toFixed(1)}%`}
            sub={`${metrics.sny.optedInUsers} / ${metrics.sny.eligibleUsers} eligible`}
          />
        </dl>
      </section>

      {/* Category breakdown */}
      <section aria-labelledby="category-heading">
        <h2 id="category-heading" className="text-ui font-medium text-text mb-4 uppercase tracking-wide text-sm">
          Category Breakdown
        </h2>
        {safety.categoryBreakdown.length === 0 ? (
          <p className="text-ui text-text-muted">No category data for this period.</p>
        ) : (
          <table className="w-full text-ui" aria-label="Category breakdown">
            <thead>
              <tr className="border-b border-border text-left text-caption text-text-muted">
                <th scope="col" className="pb-2 font-medium">Category</th>
                <th scope="col" className="pb-2 font-medium text-right">Posts</th>
                <th scope="col" className="pb-2 font-medium text-right">Reports</th>
                <th scope="col" className="pb-2 font-medium text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {safety.categoryBreakdown.map((row) => (
                <tr key={row.categoryId} className="border-b border-border last:border-0">
                  <td className="py-2 text-text">{row.categoryId}</td>
                  <td className="py-2 text-right text-text-muted">{row.postVolume}</td>
                  <td className="py-2 text-right text-text-muted">{row.reportCount}</td>
                  <td className="py-2 text-right text-text-muted">{(row.reportRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

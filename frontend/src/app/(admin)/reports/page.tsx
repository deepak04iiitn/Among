/**
 * /admin/reports — Moderation queue page.
 *
 * Lists open reports, sorted crisis-first. Moderators and admins can
 * action each report (dismiss, warn, restrict, ban).
 *
 * Privacy: reporter identity is never shown (stripped server-side).
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { fetchReportQueue, actionReport, type AdminReport } from '../../../lib/adminApi';
import { ROUTES } from '../../../constants/routes';

export default function AdminReportsPage() {
  const [reports, setReports]   = useState<AdminReport[]>([]);
  const [cursor,  setCursor]    = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  const load = useCallback(async (c?: string) => {
    try {
      setLoading(true);
      const data = await fetchReportQueue(c);
      setReports((prev) => c ? [...prev, ...data.reports] : data.reports);
      setCursor(data.cursor);
    } catch {
      setError('Failed to load reports. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (id: string, action: string) => {
    try {
      await actionReport(id, action);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Action failed. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-title font-editorial mb-8">Moderation Queue</h1>

      {error && (
        <p className="text-ui text-red-600 mb-4" role="alert">{error}</p>
      )}

      {loading && reports.length === 0 && (
        <p className="text-ui text-text-muted" aria-live="polite">Loading reports…</p>
      )}

      {!loading && reports.length === 0 && (
        <p className="text-ui text-text-muted">No open reports.</p>
      )}

      <ul className="space-y-4" aria-label="Open reports">
        {reports.map((report) => (
          <li key={report.id} className="border border-border p-5 rounded-radius-md">
            <div className="flex items-start gap-3">
              {report.isCrisisFlagged && (
                <AlertTriangle
                  className="text-red-500 shrink-0 mt-0.5"
                  size={16}
                  strokeWidth={1.5}
                  aria-label="Crisis flagged"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-ui font-medium text-text capitalize">{report.reason.replace(/_/g, ' ')}</span>
                  <span className={`text-caption px-2 py-0.5 rounded-full border ${
                    report.severity === 'critical' ? 'border-red-300 text-red-700' :
                    report.severity === 'high'     ? 'border-orange-300 text-orange-700' :
                    'border-border text-text-muted'
                  }`}>
                    {report.severity}
                  </span>
                  <span className="text-caption text-text-muted capitalize">{report.reportedContentType}</span>
                </div>
                <div className="flex items-center gap-1 text-caption text-text-muted">
                  <Clock size={12} strokeWidth={1.5} />
                  <time dateTime={report.createdAt}>
                    {new Date(report.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={ROUTES.ADMIN_REPORT_DETAIL(report.id)}
                  className="text-ui text-text-muted hover:text-text flex items-center gap-1 transition-colors"
                  aria-label={`View report ${report.id}`}
                >
                  Detail <ChevronRight size={14} strokeWidth={1.5} />
                </Link>
                <button
                  onClick={() => void handleAction(report.id, 'dismiss')}
                  className="text-ui text-text-muted hover:text-text transition-colors"
                  aria-label={`Dismiss report ${report.id}`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {cursor && (
        <button
          onClick={() => void load(cursor)}
          disabled={loading}
          className="mt-6 text-ui text-text-muted hover:text-text transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

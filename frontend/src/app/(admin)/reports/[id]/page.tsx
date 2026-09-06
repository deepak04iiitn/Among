/**
 * /admin/reports/[id] — Report detail page.
 *
 * Shows detailed report context to the moderator.
 * Reporter identity is never displayed — stripped server-side.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams }  from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { fetchReportDetail, actionReport, type AdminReport } from '../../../../lib/adminApi';
import { ROUTES } from '../../../../constants/routes';

const ACTIONS = [
  { id: 'warn',                label: 'Issue warning' },
  { id: 'cooldown',            label: 'Apply 24h cooldown' },
  { id: 'restrict',            label: 'Restrict account (7 days)' },
  { id: 'ban',                 label: 'Permanent ban (Admin only)' },
  { id: 'force_alias_rotation', label: 'Force alias rotation' },
  { id: 'dismiss',             label: 'Dismiss — no action' },
] as const;

export default function AdminReportDetailPage() {
  const { id }              = useParams<{ id: string }>();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [notes, setNotes]   = useState('');
  const [actioned, setActioned] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchReportDetail(id)
      .then(setReport)
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    if (!id) return;
    try {
      await actionReport(id, action, notes || undefined);
      setActioned(true);
    } catch {
      setError('Action failed. Please try again.');
    }
  };

  if (loading) return <p className="text-ui text-text-muted" aria-live="polite">Loading…</p>;
  if (error)   return <p className="text-ui text-red-600" role="alert">{error}</p>;
  if (!report) return null;

  if (actioned) {
    return (
      <div>
        <p className="text-ui text-text-muted mb-4">Action applied.</p>
        <Link href={ROUTES.ADMIN_REPORTS} className="text-ui text-accent">← Back to queue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href={ROUTES.ADMIN_REPORTS} className="text-caption text-text-muted hover:text-text mb-6 block">
        ← Back to queue
      </Link>

      <h1 className="text-title font-editorial mb-6">Report Detail</h1>

      {report.isCrisisFlagged && (
        <div className="flex items-center gap-2 mb-4 text-ui text-red-700 border border-red-200 rounded-radius-md p-3">
          <AlertTriangle size={16} strokeWidth={1.5} />
          This report is crisis-flagged. Prioritise immediately.
        </div>
      )}

      <dl className="space-y-3 mb-8">
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Content Type</dt>
          <dd className="text-body text-text capitalize">{report.reportedContentType}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Reason</dt>
          <dd className="text-body text-text capitalize">{report.reason.replace(/_/g, ' ')}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Severity</dt>
          <dd className="text-body text-text capitalize">{report.severity}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Submitted</dt>
          <dd className="text-body text-text">
            <time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString()}</time>
          </dd>
        </div>
      </dl>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor="mod-notes" className="text-ui text-text-muted block mb-1">
          Moderator notes (optional)
        </label>
        <textarea
          id="mod-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-border rounded-radius-md p-3 text-body text-text bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Internal notes for this action…"
        />
      </div>

      {/* Actions */}
      <fieldset>
        <legend className="text-ui font-medium text-text mb-3">Apply action</legend>
        <div className="space-y-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => void handleAction(a.id)}
              className="w-full text-left text-ui text-text border border-border hover:border-text rounded-radius-md px-4 py-2.5 transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/**
 * /admin/users/[id] — User account detail page.
 *
 * Allows moderators/admins to view account status and apply enforcement actions.
 * Privacy: alias shown, but Firebase UID and email are never exposed.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAdminUser, adminUserAction, type AdminUser } from '../../../../lib/adminApi';
import { ROUTES } from '../../../../constants/routes';

const ENFORCEMENT_ACTIONS = [
  { id: 'warn',                 label: 'Issue warning',              description: 'Sends a formal warning to the user.' },
  { id: 'cooldown',             label: 'Apply 24h cooldown',         description: 'Prevents posting for 24 hours.' },
  { id: 'restrict',             label: 'Restrict (7 days)',          description: 'Restricts post creation for 7 days.' },
  { id: 'lift_restriction',     label: 'Lift restriction',           description: 'Removes any active restriction.' },
  { id: 'force_alias_rotation', label: 'Force alias rotation',       description: 'Resets the user\'s alias and avatar.' },
] as const;

export default function AdminUserDetailPage() {
  const { id }             = useParams<{ id: string }>();
  const [user, setUser]    = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState<string | null>(null);
  const [notes, setNotes]  = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAdminUser(id)
      .then(setUser)
      .catch(() => setError('Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    if (!id) return;
    try {
      await adminUserAction(id, action, notes || undefined);
      setSuccess(`Action "${action}" applied successfully.`);
    } catch {
      setError('Action failed. Please try again.');
    }
  };

  if (loading) return <p className="text-ui text-text-muted" aria-live="polite">Loading…</p>;
  if (error)   return <p className="text-ui text-red-600" role="alert">{error}</p>;
  if (!user)   return null;

  return (
    <div className="max-w-2xl">
      <Link
        href={ROUTES.ADMIN_REPORTS}
        className="text-caption text-text-muted hover:text-text mb-6 block"
      >
        ← Back to queue
      </Link>

      <h1 className="text-title font-editorial mb-6">User Account</h1>

      {success && (
        <p className="text-ui text-text mb-4" role="status" aria-live="polite">{success}</p>
      )}

      <dl className="space-y-3 mb-8">
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Current alias</dt>
          <dd className="text-body text-text">{user.alias}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Joined</dt>
          <dd className="text-body text-text">
            <time dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleString()}</time>
          </dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted uppercase tracking-wide">Onboarding</dt>
          <dd className="text-body text-text">{user.hasCompletedOnboarding ? 'Complete' : 'Incomplete'}</dd>
        </div>
      </dl>

      {/* Notes */}
      <div className="mb-6">
        <label htmlFor="action-notes" className="text-ui text-text-muted block mb-1">
          Notes (optional)
        </label>
        <textarea
          id="action-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-border rounded-radius-md p-3 text-body text-text bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Reason for this action…"
        />
      </div>

      {/* Enforcement actions */}
      <fieldset>
        <legend className="text-ui font-medium text-text mb-3">Enforcement actions</legend>
        <div className="space-y-2">
          {ENFORCEMENT_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => void handleAction(a.id)}
              className="w-full text-left border border-border hover:border-text rounded-radius-md px-4 py-3 transition-colors"
              aria-label={a.label}
            >
              <p className="text-ui text-text">{a.label}</p>
              <p className="text-caption text-text-muted">{a.description}</p>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

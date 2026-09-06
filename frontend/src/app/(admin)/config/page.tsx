/**
 * /admin/config — Runtime configuration page.
 *
 * Allows admins to adjust:
 *  - Ranking weights (must sum to 1.0)
 *  - Rate limits (posts/day, reactions/min, etc.)
 *  - Feature flags (toggle on/off without a deploy)
 *
 * Moderators can view config but not change it (PUT endpoints require admin role).
 */
'use client';

import { useEffect, useState } from 'react';
import {
  fetchRankingWeights,
  updateRankingWeights,
  fetchRateLimits,
  updateRateLimits,
  fetchFeatureFlags,
  toggleFeatureFlag,
  type RankingWeights,
  type RateLimits,
  type FeatureFlagMap,
} from '../../../lib/adminApi';
import { useAuth } from '../../../hooks/useAuth';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { readonly title: string; readonly sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-ui font-medium text-text uppercase tracking-wide text-sm">{title}</h2>
      {sub && <p className="text-caption text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Ranking weights section ──────────────────────────────────────────────────

function RankingWeightsSection({ isAdmin }: { readonly isAdmin: boolean }) {
  const [weights, setWeights]   = useState<RankingWeights | null>(null);
  const [draft,   setDraft]     = useState<Partial<RankingWeights>>({});
  const [saving,  setSaving]    = useState(false);
  const [msg,     setMsg]       = useState<string | null>(null);

  useEffect(() => {
    fetchRankingWeights().then((w) => { setWeights(w); setDraft(w); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateRankingWeights(draft);
      setWeights(updated);
      setDraft(updated);
      setMsg('Weights updated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!weights) return <p className="text-ui text-text-muted">Loading…</p>;

  const weightFields: { key: keyof RankingWeights; label: string }[] = [
    { key: 'w1_similarity', label: 'Experience similarity' },
    { key: 'w2_recency',    label: 'Recency' },
    { key: 'w3_quality',    label: 'Quality score' },
    { key: 'w4_diversity',  label: 'Diversity' },
    { key: 'w5_safety',     label: 'Safety confidence' },
  ];

  return (
    <section aria-labelledby="weights-heading" className="mb-10">
      <SectionHeader
        title="Ranking weights"
        sub="All w1–w5 weights must sum to 1.0. Changes take effect within ~60 seconds."
      />
      <div className="space-y-3">
        {weightFields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <label htmlFor={key} className="text-ui text-text-muted w-44">{label}</label>
            <input
              id={key}
              type="number"
              min={0}
              max={1}
              step={0.01}
              disabled={!isAdmin}
              value={(draft[key] ?? weights[key]).toString()}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: parseFloat(e.target.value) }))}
              className="border border-border rounded-radius-md px-3 py-1.5 text-ui text-text bg-background w-24 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              aria-label={`${label} weight`}
            />
          </div>
        ))}
      </div>
      {msg && <p className="text-caption text-text-muted mt-3" role="status">{msg}</p>}
      {isAdmin && (
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="mt-4 text-ui bg-text text-background px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save weights'}
        </button>
      )}
    </section>
  );
}

// ─── Rate limits section ──────────────────────────────────────────────────────

function RateLimitsSection({ isAdmin }: { readonly isAdmin: boolean }) {
  const [limits,  setLimits]  = useState<RateLimits | null>(null);
  const [draft,   setDraft]   = useState<Partial<RateLimits>>({});
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<string | null>(null);

  useEffect(() => {
    fetchRateLimits().then((l) => { setLimits(l); setDraft(l); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateRateLimits(draft);
      setLimits(updated);
      setDraft(updated);
      setMsg('Rate limits updated.');
    } catch {
      setMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!limits) return <p className="text-ui text-text-muted">Loading…</p>;

  const limitFields: { key: keyof RateLimits; label: string }[] = [
    { key: 'postsPerDay',          label: 'Posts per day' },
    { key: 'reactionsPerMinute',   label: 'Reactions per minute' },
    { key: 'reportsPerHour',       label: 'Reports per hour' },
    { key: 'aliasRotationsPerDay', label: 'Alias rotations per day' },
  ];

  return (
    <section aria-labelledby="rate-limits-heading" className="mb-10">
      <SectionHeader
        title="Rate limits"
        sub="Changes take effect within the next request cycle."
      />
      <div className="space-y-3">
        {limitFields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <label htmlFor={key} className="text-ui text-text-muted w-44">{label}</label>
            <input
              id={key}
              type="number"
              min={1}
              step={1}
              disabled={!isAdmin}
              value={(draft[key] ?? limits[key]).toString()}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: parseInt(e.target.value, 10) }))}
              className="border border-border rounded-radius-md px-3 py-1.5 text-ui text-text bg-background w-24 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              aria-label={`${label} limit`}
            />
          </div>
        ))}
      </div>
      {msg && <p className="text-caption text-text-muted mt-3" role="status">{msg}</p>}
      {isAdmin && (
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="mt-4 text-ui bg-text text-background px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save limits'}
        </button>
      )}
    </section>
  );
}

// ─── Feature flags section ────────────────────────────────────────────────────

function FeatureFlagsSection({ isAdmin }: { readonly isAdmin: boolean }) {
  const [flags,   setFlags]   = useState<FeatureFlagMap | null>(null);
  const [saving,  setSaving]  = useState<string | null>(null);
  const [msg,     setMsg]     = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureFlags().then(setFlags).catch(() => {});
  }, []);

  const handleToggle = async (flag: string, enabled: boolean) => {
    setSaving(flag);
    setMsg(null);
    try {
      const updated = await toggleFeatureFlag(flag, enabled);
      setFlags(updated);
      setMsg(`Flag "${flag}" ${enabled ? 'enabled' : 'disabled'}.`);
    } catch {
      setMsg('Toggle failed.');
    } finally {
      setSaving(null);
    }
  };

  if (!flags) return <p className="text-ui text-text-muted">Loading…</p>;

  return (
    <section aria-labelledby="flags-heading">
      <SectionHeader
        title="Feature flags"
        sub="Toggle major features without a deployment."
      />
      <ul className="space-y-3">
        {Object.entries(flags).map(([flag, enabled]) => (
          <li key={flag} className="flex items-center justify-between border border-border rounded-radius-md px-4 py-3">
            <span className="text-ui text-text">{flag}</span>
            <button
              onClick={() => void handleToggle(flag, !enabled)}
              disabled={!isAdmin || saving === flag}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 ${
                enabled ? 'bg-accent' : 'bg-border'
              }`}
              role="switch"
              aria-checked={enabled}
              aria-label={`${enabled ? 'Disable' : 'Enable'} ${flag}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-background transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
      {msg && <p className="text-caption text-text-muted mt-3" role="status">{msg}</p>}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConfigPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  return (
    <div className="max-w-2xl">
      <h1 className="text-title font-editorial mb-2">Runtime Configuration</h1>
      {!isAdmin && (
        <p className="text-ui text-text-muted mb-8">
          You have read-only access. Contact an admin to make changes.
        </p>
      )}

      <RankingWeightsSection isAdmin={isAdmin} />
      <RateLimitsSection     isAdmin={isAdmin} />
      <FeatureFlagsSection   isAdmin={isAdmin} />
    </div>
  );
}

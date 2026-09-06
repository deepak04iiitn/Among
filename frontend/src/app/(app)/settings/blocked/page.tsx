import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blocked users',
  robots: { index: false, follow: false },
};

export default function BlockedSettingsPage() {
  return (
    <div className="content-column py-10">
      <h1 className="font-editorial text-title-xl text-[var(--color-text)]">Blocked</h1>
      <p className="mt-4 text-body text-[var(--color-text-muted)]">No one blocked.</p>
    </div>
  );
}

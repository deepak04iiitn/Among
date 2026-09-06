import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <div className="content-column py-10">
      <h1 className="font-editorial text-title-xl text-[var(--color-text)]">Settings</h1>
      <p className="mt-4 font-editorial text-title text-[var(--color-text-muted)]">
        Settings — coming in a later phase.
      </p>
    </div>
  );
}

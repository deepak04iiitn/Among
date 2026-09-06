import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notification settings',
  robots: { index: false, follow: false },
};

export default function NotificationSettingsPage() {
  return (
    <div className="content-column py-10">
      <h1 className="font-editorial text-title-xl text-[var(--color-text)]">Notifications</h1>
      <p className="mt-4 text-body text-[var(--color-text-muted)]">Coming in a later phase.</p>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Category preferences',
  robots: { index: false, follow: false },
};

export default function CategorySettingsPage() {
  return (
    <div className="content-column py-10">
      <h1 className="font-editorial text-title-xl text-[var(--color-text)]">Category preferences</h1>
      <p className="mt-4 text-body text-[var(--color-text-muted)]">Coming in a later phase.</p>
    </div>
  );
}

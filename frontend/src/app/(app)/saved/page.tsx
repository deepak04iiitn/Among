import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Saved experiences</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Saved experiences — coming in Phase 5.
      </p>
    </div>
  );
}

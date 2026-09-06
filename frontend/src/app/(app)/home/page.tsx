import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

/**
 * Home feed page — Phase 3.
 * Shows the primary daily experience card + secondary discovery list.
 */
export default function HomePage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Your home feed</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Home feed — coming in Phase 3.
      </p>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'You Are Not Alone',
  robots: { index: false, follow: false },
};

/**
 * "You Are Not Alone" surface — Phase 8.
 * Aggregated experience stats with privacy threshold enforcement.
 */
export default function YouAreNotAlonePage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">You Are Not Alone</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        You Are Not Alone — coming in Phase 8.
      </p>
    </div>
  );
}

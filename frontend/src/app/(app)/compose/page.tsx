import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Share an experience',
  robots: { index: false, follow: false },
};

/**
 * Compose page — Phase 4.
 * Borderless notebook-style experience writing interface.
 */
export default function ComposePage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Share an experience</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Compose — coming in Phase 4.
      </p>
    </div>
  );
}

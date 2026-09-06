import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversations',
  robots: { index: false, follow: false },
};

/**
 * Conversations list page — Phase 7.
 */
export default function ConversationsPage() {
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Conversations</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Conversations — coming in Phase 7.
      </p>
    </div>
  );
}

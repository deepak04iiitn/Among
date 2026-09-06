import type { Metadata } from 'next';

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(_props: ConversationPageProps): Promise<Metadata> {
  return {
    title: 'Conversation',
    robots: { index: false, follow: false },
  };
}

/**
 * Conversation thread page — Phase 7.
 * Letter-exchange style UI, no chat bubbles.
 */
export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  return (
    <div className="content-column py-10">
      <h1 className="sr-only">Conversation</h1>
      <p className="font-editorial text-title text-[var(--color-text-muted)]">
        Conversation {id} — coming in Phase 7.
      </p>
    </div>
  );
}

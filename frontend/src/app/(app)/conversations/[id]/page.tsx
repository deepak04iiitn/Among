import type { Metadata } from 'next';
import type { JSX } from 'react';
import ConversationDetailView from '../../../../components/conversations/ConversationDetailView';

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(_props: ConversationPageProps): Promise<Metadata> {
  return {
    title: 'Conversation',
    robots: { index: false, follow: false },
  };
}

export default async function ConversationPage({ params }: ConversationPageProps): Promise<JSX.Element> {
  const { id } = await params;
  return <ConversationDetailView conversationId={id} />;
}

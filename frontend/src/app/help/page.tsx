import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { ROUTES } from '../../constants/routes';

export const metadata: Metadata = {
  title: 'Help — AMONG',
  description:
    'Help and FAQs for AMONG. Learn how anonymity works, how to manage your alias, and how to stay safe.',
  alternates: { canonical: '/help' },
};

export default function HelpPage() {
  const faqs = [
    {
      q: 'Is AMONG truly anonymous?',
      a: 'Yes. Your name, email, and identity are never shared with other users. You are represented only by a randomly generated alias. Your alias rotates over time, further protecting your privacy.',
    },
    {
      q: 'Can other users find out who I am?',
      a: 'No. There are no public profiles, no follower lists, no "view all posts by this user" pages. Your alias is temporary and abstract. No one can connect your posts to your real identity.',
    },
    {
      q: 'What happens to my data if I delete my account?',
      a: 'When you delete your account, all your personal data is anonymized and your account is removed. Your posts become fully anonymous with no connection to any account.',
    },
    {
      q: 'How do conversations work?',
      a: 'Conversations are temporary — they expire after 48 hours of inactivity or 48 hours total. They are designed to be meaningful moments of connection, not persistent relationships.',
    },
    {
      q: 'What is "You Are Not Alone"?',
      a: 'A surface that shows you aggregated, anonymous statistics about how many people share your experiences — without revealing any individual identities.',
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="content-column py-10">
        <Breadcrumb
          segments={[{ label: 'AMONG', href: ROUTES.LANDING }, { label: 'Help' }]}
          className="mb-6"
        />

        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Help &amp; FAQs
        </h1>

        <div className="mt-8 space-y-8 max-w-reading">
          {faqs.map(({ q, a }) => (
            <section key={q}>
              <h2 className="font-editorial text-title text-[var(--color-text)]">{q}</h2>
              <p className="mt-2 text-body text-[var(--color-text-secondary)]">{a}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-wrap gap-4">
          <Link href={ROUTES.GUIDELINES} className="text-ui text-[var(--color-accent)] hover:opacity-80">Community guidelines →</Link>
          <Link href={ROUTES.ABOUT}      className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">About AMONG</Link>
          <Link href={ROUTES.EXPLORE}    className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Explore experiences</Link>
        </div>
      </div>
    </AppShell>
  );
}

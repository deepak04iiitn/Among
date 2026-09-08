import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { ROUTES } from '../../constants/routes';

export const metadata: Metadata = {
  title: 'About AMONG — anonymous human experiences',
  description:
    'AMONG is an anonymous network built around shared lived experiences. No followers, no profiles, no public reputation — just honest human connection.',
  alternates: { canonical: '/about' },
  openGraph: {
    title:       'About AMONG',
    description: 'Anonymous. Human. Built for connection over performance.',
    url:         '/about',
    type:        'website',
  },
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AMONG',
    url: 'https://among.io',
    description:
      'AMONG is an anonymous human-experience network built around shared lived experiences.',
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="content-column py-10">
        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          About AMONG
        </h1>

        <div className="mt-6 space-y-6 max-w-reading">
          <p className="text-body-lg text-[var(--color-text-secondary)]">
            AMONG is an anonymous human-experience network. It is not a social media platform,
            not a confession app, not a therapy replacement. It is a place for people to say
            what they actually experience — and to find others who have been there too.
          </p>
          <p className="text-body text-[var(--color-text-secondary)]">
            No names. No followers. No public reputation. No like counts. No algorithmic dopamine loops.
            Just honest, anonymous experiences — organized around the things humans actually go through.
          </p>
          <p className="text-body text-[var(--color-text-secondary)]">
            The core promise of AMONG is simple: <em>You&apos;re not the only one.</em>
          </p>
        </div>

        {/* Internal links — FR-SEO-14, FR-SEO-16 */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-wrap gap-4">
          <Link href={ROUTES.EXPLORE}    className="text-ui text-[var(--color-accent)] hover:opacity-80">Explore experiences →</Link>
          <Link href={ROUTES.GUIDELINES} className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Community guidelines</Link>
          <Link href={ROUTES.HELP}       className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Help</Link>
        </div>
      </div>
    </AppShell>
  );
}

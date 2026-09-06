import type { Metadata } from 'next';
import Link from 'next/link';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { ROUTES } from '../../constants/routes';
import AppShell from '../../components/layout/AppShell';
import Breadcrumb from '../../components/layout/Breadcrumb';

export const metadata: Metadata = {
  title: 'Explore experiences — AMONG',
  description:
    'Browse human experiences shared anonymously on AMONG. Find people who have been through loneliness, grief, career struggles, relationships, and more.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title:       'Explore experiences — AMONG',
    description: 'Browse human experiences shared anonymously. No names. Just truth.',
    url:         '/explore',
    type:        'website',
  },
};

/**
 * Public explore page — lists all experience categories.
 * SEO: SSR, unique title/description, canonical, BreadcrumbList JSON-LD.
 * FR-SEO-1, FR-SEO-2, FR-SEO-3, FR-SEO-16.
 */
export default function ExplorePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AMONG', item: 'https://among.io' },
      { '@type': 'ListItem', position: 2, name: 'Explore' },
    ],
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="content-column py-10">
        <Breadcrumb
          segments={[{ label: 'AMONG', href: ROUTES.LANDING }, { label: 'Explore' }]}
          className="mb-6"
        />

        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Browse experiences
        </h1>
        <p className="mt-3 text-body-lg text-[var(--color-text-secondary)] max-w-reading">
          Explore what others have been through — anonymously. Find people who understand.
        </p>

        {/* Category grid */}
        <ul
          aria-label="Experience categories"
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-px border border-[var(--color-border)] rounded-lg overflow-hidden"
        >
          {EXPERIENCE_CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <Link
                href={ROUTES.EXPLORE_CATEGORY(cat.slug)}
                className="group flex flex-col gap-1 p-6 bg-[var(--color-bg)]
                           hover:bg-[var(--color-bg-subtle)] transition-colors
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-[-2px]"
                aria-label={`Explore ${cat.displayName}`}
              >
                <span className="font-editorial text-title text-[var(--color-text)]
                                 group-hover:text-[var(--color-accent)] transition-colors">
                  {cat.displayName}
                </span>
                <span className="text-caption text-[var(--color-text-muted)] line-clamp-2">
                  {cat.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* SEO internal links — FR-SEO-16 */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <p className="text-caption text-[var(--color-text-muted)] mb-4">More from AMONG</p>
          <div className="flex flex-wrap gap-3">
            <Link href={ROUTES.ABOUT}      className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity">About AMONG</Link>
            <Link href={ROUTES.GUIDELINES} className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity">Community guidelines</Link>
            <Link href={ROUTES.HELP}       className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity">Help</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

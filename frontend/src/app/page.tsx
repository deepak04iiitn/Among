/**
 * Landing page — shown to logged-out visitors.
 * Server component — fully SSR for SEO and Core Web Vitals.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../constants/experienceCategories';

export const metadata: Metadata = {
  title: 'AMONG — You are not alone in this',
  description:
    'A private, anonymous space to share your lived experiences and connect with people who have been there too. No names. No followers. Just truth.',
  alternates: {
    canonical: '/',
  },
};

// Structured data — WebSite schema
const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AMONG',
  url: 'https://among.io',
  description:
    'An anonymous community for sharing lived human experiences.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://among.io/explore/{search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function LandingPage() {
  const featuredCategories = EXPERIENCE_CATEGORIES.slice(0, 6);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />

      <main className="min-h-dvh flex flex-col">
        {/* ─── Navigation bar ─────────────────────────────────────────── */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
          <span className="font-editorial text-title font-medium tracking-tight">AMONG</span>
          <nav className="flex items-center gap-4">
            <Link href={ROUTES.EXPLORE} className="text-ui text-text-secondary hover:text-text transition-colors">
              Explore
            </Link>
            <Link
              href={ROUTES.ONBOARDING_INTENT}
              className="text-ui px-4 py-2 bg-text text-bg rounded-md hover:opacity-90 transition-opacity"
            >
              Join
            </Link>
          </nav>
        </header>

        {/* ─── Hero ───────────────────────────────────────────────────── */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto">
          <p className="text-caption text-text-muted uppercase tracking-[0.15em] mb-8">
            A private space for lived experience
          </p>
          <h1 className="text-display font-editorial font-normal text-balance leading-[1.05] tracking-[-0.03em] mb-8">
            You are not alone in this
          </h1>
          <p className="text-body-lg text-text-secondary max-w-reading text-balance mb-12">
            AMONG is where people share the things they cannot say anywhere else —
            anonymously, without judgment, and always with someone who has been there.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              href={ROUTES.ONBOARDING_INTENT}
              className="px-8 py-3.5 bg-text text-bg font-ui text-body rounded-md hover:opacity-90 transition-opacity"
            >
              Start sharing
            </Link>
            <Link
              href={ROUTES.EXPLORE}
              className="px-8 py-3.5 border border-border text-text font-ui text-body rounded-md hover:border-border-strong transition-colors"
            >
              Browse experiences
            </Link>
          </div>
        </section>

        {/* ─── Category overview ──────────────────────────────────────── */}
        <section className="border-t border-border py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-caption text-text-muted uppercase tracking-[0.15em] mb-8 text-center">
              What people are sharing
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={ROUTES.EXPLORE_CATEGORY(cat.slug)}
                  className="category-chip"
                >
                  {cat.displayName}
                </Link>
              ))}
              <Link href={ROUTES.EXPLORE} className="category-chip">
                View all →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-border py-8 px-6 text-center">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-caption text-text-muted">
              © {new Date().getFullYear()} AMONG
            </span>
            <nav className="flex gap-6">
              <Link href={ROUTES.ABOUT} className="text-caption text-text-muted hover:text-text-secondary transition-colors">
                About
              </Link>
              <Link href={ROUTES.GUIDELINES} className="text-caption text-text-muted hover:text-text-secondary transition-colors">
                Guidelines
              </Link>
              <Link href={ROUTES.HELP} className="text-caption text-text-muted hover:text-text-secondary transition-colors">
                Help
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}

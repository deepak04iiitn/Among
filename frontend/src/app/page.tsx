/**
 * Landing page — shown to logged-out visitors.
 * Server component — fully SSR for SEO and Core Web Vitals.
 *
 * Design (Plan §7B.6 — Landing Page):
 *  - Full-viewport hero: centered, cream linen, zero imagery.
 *  - H1 in `font-editorial text-display` with word-stagger animation.
 *  - Single CTA: "Enter Among →" — inverted pill (espresso on linen).
 *  - Scrollable editorial sections: staggered two-column typographic blocks.
 *  - Experience category strip: horizontal flowing name list, text only.
 *  - Footer tagline: small, honest, not marketed.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../constants/experienceCategories';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'AMONG — You are not alone in this',
  description:
    'A private, anonymous space to share your lived experiences and connect with people who have been there too. No names. No followers. Just truth.',
  alternates: {
    canonical: '/',
  },
};

// ─── Structured data ─────────────────────────────────────────────────────────

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AMONG',
  url: 'https://among.io',
  description: 'An anonymous community for sharing lived human experiences.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://among.io/explore/{search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

const orgStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AMONG',
  url: 'https://among.io',
  description: 'An anonymous human-experience network.',
};

// ─── Editorial sections ───────────────────────────────────────────────────────

interface EditorialBlock {
  readonly statement:  string;
  readonly elaboration: string;
}

const EDITORIAL_BLOCKS: readonly EditorialBlock[] = [
  {
    statement:   'Say what you can\'t say anywhere else.',
    elaboration: 'Your words. Your experience. No name attached. No audience watching.',
  },
  {
    statement:   'Find people who have been there.',
    elaboration: 'Not advice. Not sympathy. Just someone who knows — because they\'ve lived it too.',
  },
  {
    statement:   'Anonymity with accountability.',
    elaboration: 'You are anonymous to others. The platform keeps everyone safe.',
  },
] as const;

// ─── Hero words for stagger animation ────────────────────────────────────────
// Each word gets a staggered entrance animation via CSS custom delay.

const HERO_WORDS = ["You're", 'not', 'the', 'only', 'one.'] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgStructuredData) }}
      />

      <div className="min-h-dvh flex flex-col bg-[var(--color-bg)]">

        {/* ── Primary navigation — shared Floating Capsule (docs/theme.md §7) ── */}
        <Navigation />

        <main id="main-content">
          {/* ── Hero — full-viewport, centered, cream linen ──────────────── */}
          <section
            aria-label="Welcome to AMONG"
            className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-40 min-h-[calc(100dvh-3.5rem)]"
          >
            {/* Ambient eyebrow */}
            <p className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-[0.15em] mb-8 animate-[fadeIn_400ms_var(--ease-out)_both]">
              An anonymous human-experience network
            </p>

            {/* Hero H1 — word stagger animation */}
            <h1
              className="font-editorial text-title-xl md:text-display text-[var(--color-text)] text-balance mb-8"
              aria-label="You're not the only one."
            >
              {HERO_WORDS.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="word-reveal"
                  aria-hidden="true"
                >
                  <span
                    style={{
                      animationDelay: `${i * 150}ms`,
                    }}
                  >
                    {word}
                  </span>
                  {i < HERO_WORDS.length - 1 && '\u00A0'}
                </span>
              ))}
            </h1>

            {/* Sub-tagline */}
            <p
              className="text-body-lg text-[var(--color-text-secondary)] max-w-reading text-balance mb-12 animate-[fadeIn_400ms_900ms_var(--ease-out)_both]"
            >
              Find people who&apos;ve been there.
            </p>

            {/* Single CTA */}
            <div className="animate-[fadeIn_400ms_1100ms_var(--ease-out)_both]">
              <Link
                href={ROUTES.ONBOARDING_INTENT}
                className="btn-primary text-body px-8 py-3.5"
              >
                Enter Among →
              </Link>
            </div>

            {/* Scroll cue */}
            <p className="mt-16 text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] animate-[fadeIn_400ms_1500ms_var(--ease-out)_both]">
              scroll to learn more ↓
            </p>
          </section>

          {/* ── Editorial sections — staggered two-column blocks ───────────── */}
          <section
            aria-label="What AMONG is"
            className="border-t border-[var(--color-border)] px-5 md:px-8 py-20 md:py-28"
          >
            <div className="max-w-shell mx-auto space-y-16 md:space-y-24">
              {EDITORIAL_BLOCKS.map((block, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-start"
                >
                  {/* Large serif statement — left column */}
                  <p className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
                    {block.statement}
                  </p>
                  {/* Small elaboration — right column */}
                  <p className="text-body text-[var(--color-text-secondary)] max-w-reading self-center md:pt-1">
                    {block.elaboration}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Experience category strip ──────────────────────────────────── */}
          {/* Horizontal flowing text list — curiosity, not navigation */}
          <section
            aria-label="Experience categories"
            className="border-t border-[var(--color-border)] py-16 overflow-hidden"
          >
            <div className="px-5 md:px-8 max-w-shell mx-auto mb-6">
              <p className="text-caption text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-[0.12em]">
                What people are sharing
              </p>
            </div>

            {/* Flowing category names — click takes to that category */}
            <div
              className="px-5 md:px-8 max-w-shell mx-auto flex flex-wrap gap-x-6 gap-y-2"
              role="list"
              aria-label="Browse experience categories"
            >
              {EXPERIENCE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={ROUTES.EXPLORE_CATEGORY(cat.slug)}
                  role="listitem"
                  className="font-editorial text-title text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-[var(--duration-fast)]"
                >
                  {cat.displayName}
                </Link>
              ))}
            </div>

            <div className="mt-8 px-5 md:px-8 max-w-shell mx-auto">
              <Link
                href={ROUTES.EXPLORE}
                className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                Browse all experiences →
              </Link>
            </div>
          </section>

          {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
          <section
            aria-label="Join AMONG"
            className="border-t border-[var(--color-border)] py-20 md:py-28 text-center px-5"
          >
            <p className="font-editorial text-headline text-[var(--color-text)] text-balance max-w-reading mx-auto mb-8">
              You have been through things no one else knows.
            </p>
            <Link
              href={ROUTES.ONBOARDING_INTENT}
              className="btn-primary text-body px-8 py-3.5"
            >
              Enter Among →
            </Link>
          </section>
        </main>

        {/* ── Primary footer — shared Letter / Typesetter (docs/theme.md §7) ── */}
        <Footer />
      </div>
    </>
  );
}

/**
 * seoUtils.ts — SEO metadata generation utilities.
 *
 * Used by Next.js App Router `generateMetadata()` exports.
 * Returns typed Metadata objects — never raw strings.
 *
 * Requirements: FR-SEO-1 through FR-SEO-8.
 */
import type { Metadata }      from 'next';
import { SITE_URL, SITE_NAME, OG_DEFAULTS } from '../constants/seo';

/** Build Next.js Metadata with canonical, OG, and Twitter card */
export function buildPageMeta(opts: {
  title:         string;
  description:   string;
  canonical:     string;
  keywords?:     readonly string[];
  noIndex?:      boolean;
  ogTitle?:      string;
  ogDescription?: string;
}): Metadata {
  const absoluteCanonical = opts.canonical.startsWith('http')
    ? opts.canonical
    : `${SITE_URL}${opts.canonical}`;

  const ogTitle       = opts.ogTitle       ?? opts.title;
  const ogDescription = opts.ogDescription ?? opts.description;

  return {
    title:       opts.title,
    description: opts.description,
    keywords:    opts.keywords as string[],
    alternates:  { canonical: opts.canonical },
    robots:      opts.noIndex
      ? { index: false, follow: false }
      : { index: true,  follow: true  },
    openGraph: {
      title:       ogTitle,
      description: ogDescription,
      url:         absoluteCanonical,
      type:        OG_DEFAULTS.type,
      siteName:    OG_DEFAULTS.siteName,
      locale:      OG_DEFAULTS.locale,
    },
    twitter: {
      card:        'summary',
      title:       ogTitle,
      description: ogDescription,
    },
  };
}

// ─── Structured data helpers ──────────────────────────────────────────────────

/** JSON-LD Organization (landing, about) */
export function buildOrganizationJsonLd(): object {
  return {
    '@context':   'https://schema.org',
    '@type':      'Organization',
    name:         SITE_NAME,
    url:          SITE_URL,
    description:  'AMONG is an anonymous human-experience network built around shared lived experiences.',
    sameAs:       [],
  };
}

/** JSON-LD WebSite (landing) */
export function buildWebSiteJsonLd(): object {
  return {
    '@context':  'https://schema.org',
    '@type':     'WebSite',
    name:        SITE_NAME,
    url:         SITE_URL,
    description: 'A private, anonymous network built around shared human experiences.',
  };
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/** JSON-LD FAQPage for help and the public landing (FR-SEO-7) */
export function buildFaqPageJsonLd(faqs: readonly FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type':          'Question',
      name:             item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    item.answer,
      },
    })),
  };
}

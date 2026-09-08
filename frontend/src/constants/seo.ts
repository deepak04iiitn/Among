/**
 * seo.ts — SEO meta templates for every page type.
 *
 * Never hardcode titles or descriptions in page files.
 * All meta strings are centralized here.
 *
 * Requirements: FR-SEO-2, FR-SEO-21, FR-SEO-22.
 */

export const SITE_NAME = 'AMONG';
export const SITE_URL  = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io';

/** Per-page meta templates */
export const PAGE_META = {
  LANDING: {
    title:       "Anonymous lived experiences — you're not alone | AMONG",
    description:
      'A private anonymous community to share lived experiences and find people who have been through loneliness, work, family, and more. No names. No followers.',
    keywords: [
      'anonymous community',
      'shared lived experiences',
      'you are not alone',
      'anonymous support',
      'loneliness',
      'emotional support',
    ],
  },

  EXPLORE: {
    title:       'Browse anonymous rooms of lived experience | AMONG',
    description:
      'Enter public rooms of anonymous lived experience — loneliness, work, family, love, and things you cannot say. Read without an account. No names. No followers.',
    keywords:    ['explore experiences', 'anonymous stories', 'shared human experiences', 'emotional support community'],
  },

  CATEGORY: (displayName: string, slug: string) => ({
    title:       `${displayName} — anonymous experiences | AMONG`,
    description: `Read and share anonymous experiences about ${displayName.toLowerCase()}. Find people who have been through the same thing. No names. Just truth.`,
    keywords:    [displayName.toLowerCase(), 'anonymous experiences', 'shared stories', 'emotional support'],
    canonical:   `/explore/${slug}`,
  }),

  POST_DETAIL: (id: string) => ({
    title:       `Anonymous experience | AMONG`,
    description: 'An anonymous experience shared on AMONG — a private network for lived human stories. No names, no followers.',
    canonical:   `/post/${id}`,
  }),

  ABOUT: {
    title:       'About AMONG — anonymous human experiences',
    description: 'AMONG is an anonymous network built around shared lived experiences. No followers, no profiles, no public reputation — just honest human connection.',
    keywords:    ['about AMONG', 'anonymous community', 'human experiences'],
  },

  GUIDELINES: {
    title:       'Community guidelines — AMONG',
    description: 'AMONG community guidelines: how we keep this space safe, honest, and human. Anonymity without unaccountability.',
    keywords:    ['community guidelines', 'safety', 'anonymous community rules'],
  },

  HELP: {
    title:       'Help — AMONG',
    description: 'Answers to common questions about AMONG — how anonymity works, how conversations work, and how to get support.',
    keywords:    ['help', 'FAQ', 'AMONG support', 'how it works'],
  },

  SITEMAP: {
    title:       'Sitemap — AMONG',
    description: 'A full list of all public pages on AMONG.',
    keywords:    [],
  },

  NOT_FOUND: {
    title:       'Page not found — AMONG',
    description: 'The page you are looking for could not be found.',
    keywords:    [],
  },
} as const;

/** Open Graph defaults (no PII ever included) */
export const OG_DEFAULTS = {
  type:       'website' as const,
  siteName:   SITE_NAME,
  locale:     'en_US',
  imageAlt:   'AMONG — anonymous human experiences',
} as const;

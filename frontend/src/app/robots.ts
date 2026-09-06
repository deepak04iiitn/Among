/**
 * robots.ts — robots.txt generation.
 *
 * Explicitly allows all public/crawlable pages.
 * Explicitly disallows all authenticated, private, and admin pages.
 *
 * Requirements: FR-SEO-6.
 */
import type { MetadataRoute } from 'next';

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/explore/*',
          '/about',
          '/guidelines',
          '/help',
          '/sitemap',
        ],
        disallow: [
          '/home',
          '/home/*',
          '/conversations',
          '/conversations/*',
          '/compose',
          '/compose/*',
          '/settings',
          '/settings/*',
          '/admin',
          '/admin/*',
          '/someone-needs-you',
          '/someone-needs-you/*',
          '/saved',
          '/saved/*',
          '/you-are-not-alone',
          '/you-are-not-alone/*',
          '/onboarding',
          '/onboarding/*',
          '/api',
          '/api/*',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host:    siteUrl,
  };
}

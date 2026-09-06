import type { MetadataRoute } from 'next';
import { ROBOTS_DISALLOWED_ROUTES } from '../constants/routes';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_DISALLOWED_ROUTES],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

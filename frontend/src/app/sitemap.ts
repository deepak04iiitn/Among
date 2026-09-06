import type { MetadataRoute } from 'next';
import { PUBLIC_SITEMAP_ROUTES } from '../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../constants/experienceCategories';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://among.io';
  const now = new Date();

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  // Category browse pages
  const categoryRoutes: MetadataRoute.Sitemap = EXPERIENCE_CATEGORIES.map((cat) => ({
    url: `${siteUrl}/explore/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes];
}

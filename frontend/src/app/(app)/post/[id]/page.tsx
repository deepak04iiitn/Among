/**
 * Post detail page — SSR, no caching (content changes frequently).
 *
 * SEO:
 *  - FR-SEO-1: server-rendered.
 *  - FR-SEO-2: unique title + description per post (generic — no PII).
 *  - FR-SEO-3: canonical URL.
 *  - FR-SEO-8: OG + Twitter Card meta (no post content in preview).
 *  - FR-SEO-19: deleted/expired posts render a soft-404 with nav links.
 *
 * Privacy: post body is never included in meta tags or OG preview.
 */
import type { Metadata }  from 'next';
import { notFound }       from 'next/navigation';
import Link               from 'next/link';
import JsonLd             from '../../../../components/common/JsonLd';
import AppShell           from '../../../../components/layout/AppShell';
import Breadcrumb         from '../../../../components/layout/Breadcrumb';
import { buildPageMeta, buildBreadcrumbJsonLd } from '../../../../utils/seoUtils';
import { PAGE_META, SITE_URL }                  from '../../../../constants/seo';
import { ROUTES }                               from '../../../../constants/routes';
import { EXPERIENCE_CATEGORIES }               from '../../../../constants/experienceCategories';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

// Force dynamic SSR — post content is ephemeral, never ISR-cached
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const meta   = PAGE_META.POST_DETAIL(id);

  return buildPageMeta({
    title:       meta.title,
    description: meta.description,
    canonical:   meta.canonical,
  });
}

/**
 * Attempt to fetch a public post from the API.
 * Returns null if deleted, expired, or not found.
 */
async function fetchPublicPost(id: string): Promise<{
  id:          string;
  body:        string;
  categoryIds: string[];
  publishedAt: string;
  state:       string;
} | null> {
  try {
    const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
    const res     = await fetch(`${baseUrl}/api/posts/${id}`, {
      next: { revalidate: 0 }, // always fresh
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      id: string; body: string; categoryIds: string[]; publishedAt: string; state: string;
    };
  } catch {
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post   = await fetchPublicPost(id);

  // ─── Soft-404: deleted / expired / not found (FR-SEO-19) ─────────────────
  if (!post) {
    // Find a related category to link to — use loneliness as safe default
    const fallbackCategory = EXPERIENCE_CATEGORIES[0];

    return (
      <AppShell>
        <div className="content-column py-10">
          <h1 className="font-editorial text-title text-[var(--color-text)] mb-4">
            This experience is no longer available
          </h1>
          <p className="text-body text-[var(--color-text-muted)] mb-8 max-w-reading">
            The experience you are looking for may have been removed, expired, or the link may be incorrect.
            Experiences on AMONG are temporary by design.
          </p>

          {/* Navigation links — ensures no dead end (FR-SEO-14) */}
          <nav aria-label="Return to exploring">
            <ul className="flex flex-wrap gap-4">
              <li>
                <Link
                  href={ROUTES.EXPLORE}
                  className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                >
                  Explore all experiences →
                </Link>
              </li>
              {fallbackCategory && (
                <li>
                  <Link
                    href={ROUTES.EXPLORE_CATEGORY(fallbackCategory.slug)}
                    className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {fallbackCategory.displayName} experiences
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href={ROUTES.LANDING}
                  className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Back to AMONG
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </AppShell>
    );
  }

  // Resolve category for breadcrumb
  const primaryCategoryId = post.categoryIds[0];
  const category = EXPERIENCE_CATEGORIES.find((c) => c.id === primaryCategoryId);

  const breadcrumbData = buildBreadcrumbJsonLd([
    { name: 'AMONG',   url: SITE_URL },
    { name: 'Explore', url: `${SITE_URL}/explore` },
    ...(category ? [{ name: category.displayName, url: `${SITE_URL}/explore/${category.slug}` }] : []),
    { name: 'Experience', url: `${SITE_URL}/post/${id}` },
  ]);

  return (
    <AppShell>
      <JsonLd data={breadcrumbData} id="post-breadcrumb" />

      <div className="content-column py-10">
        <Breadcrumb
          segments={[
            { label: 'AMONG',   href: ROUTES.LANDING },
            { label: 'Explore', href: ROUTES.EXPLORE },
            ...(category ? [{ label: category.displayName, href: ROUTES.EXPLORE_CATEGORY(category.slug) }] : []),
            { label: 'Experience' },
          ]}
          className="mb-6"
        />

        {/* Post body — editorial typography */}
        <article aria-labelledby="post-heading">
          <h1 id="post-heading" className="sr-only">
            Anonymous experience on AMONG
          </h1>

          <div className="max-w-reading">
            <p className="font-editorial text-headline text-[var(--color-text)] leading-relaxed">
              {post.body}
            </p>

            {/* Category tags — text only, no chips (FR-UI) */}
            {category && (
              <p className="mt-6 text-caption text-[var(--color-text-muted)]">
                Filed under{' '}
                <Link
                  href={ROUTES.EXPLORE_CATEGORY(category.slug)}
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  {category.displayName}
                </Link>
              </p>
            )}
          </div>

          {/* Internal links to related categories (FR-SEO-16) */}
          {category && category.relatedCategoryIds.length > 0 && (
            <nav aria-label="Related experiences" className="mt-10 pt-6 border-t border-[var(--color-border)]">
              <p className="text-caption text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                Related experiences
              </p>
              <ul className="flex flex-wrap gap-3">
                {EXPERIENCE_CATEGORIES
                  .filter((c) => category.relatedCategoryIds.includes(c.id))
                  .slice(0, 4)
                  .map((relCat) => (
                    <li key={relCat.id}>
                      <Link
                        href={ROUTES.EXPLORE_CATEGORY(relCat.slug)}
                        className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      >
                        {relCat.displayName} →
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          )}
        </article>
      </div>
    </AppShell>
  );
}

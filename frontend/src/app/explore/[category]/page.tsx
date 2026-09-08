import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EXPERIENCE_CATEGORIES } from '../../../constants/experienceCategories';
import { ROUTES } from '../../../constants/routes';
import AppShell from '../../../components/layout/AppShell';

// ISR: revalidate every 5 minutes (FR-SEO-1)
export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return EXPERIENCE_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return {};

  return {
    title: `${cat.displayName} — anonymous experiences | AMONG`,
    description: `Read and share anonymous experiences about ${cat.displayName.toLowerCase()}. Find people who have been through the same thing.`,
    alternates: { canonical: `/explore/${cat.slug}` },
    openGraph: {
      title:       `${cat.displayName} experiences — AMONG`,
      description: `Anonymous experiences about ${cat.displayName.toLowerCase()}. No names. Just truth.`,
      url:         `/explore/${cat.slug}`,
      type:        'website',
    },
  };
}

/**
 * Category explore page — SSR with ISR.
 * SEO: unique title/description, canonical, internal links.
 * FR-SEO-1, FR-SEO-2, FR-SEO-3, FR-SEO-16.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) notFound();

  // Build related categories for SEO internal linking (FR-SEO-16: min 3 contextual links)
  const relatedCategories = EXPERIENCE_CATEGORIES.filter(
    (c) => cat.relatedCategoryIds.includes(c.id) && c.id !== cat.id
  ).slice(0, 4);

  return (
    <AppShell>
      <div className="content-column py-10">
        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          {cat.displayName}
        </h1>
        <p className="mt-3 text-body-lg text-[var(--color-text-secondary)] max-w-reading">
          {cat.description}
        </p>

        {/* Posts — Phase 5 */}
        <div className="mt-10 py-16 text-center">
          <p className="font-editorial text-title text-[var(--color-text-muted)]">
            Quiet here for now. Be the first to share something.
          </p>
        </div>

        {/* Related categories — SEO internal linking FR-SEO-16 */}
        {relatedCategories.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
            <p className="text-ui font-medium text-[var(--color-text)] mb-4">
              Related experiences
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((related) => (
                <Link
                  key={related.id}
                  href={ROUTES.EXPLORE_CATEGORY(related.slug)}
                  className="category-chip"
                >
                  {related.displayName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SEO internal links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={ROUTES.EXPLORE}    className="text-ui text-[var(--color-accent)] hover:opacity-80 transition-opacity">All experiences →</Link>
          <Link href={ROUTES.ABOUT}      className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">About AMONG</Link>
          <Link href={ROUTES.GUIDELINES} className="text-ui text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Guidelines</Link>
        </div>
      </div>
    </AppShell>
  );
}

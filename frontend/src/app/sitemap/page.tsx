import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { ROUTES } from '../../constants/routes';

export const metadata: Metadata = {
  title: 'Sitemap — AMONG',
  description: 'A full list of all public pages on AMONG.',
  alternates: { canonical: '/sitemap' },
};

/**
 * HTML sitemap page — FR-SEO-17.
 * Links to every top-level category and static page.
 */
export default function SitemapPage() {
  return (
    <AppShell>
      <div className="content-column py-10">
        <Breadcrumb
          segments={[{ label: 'AMONG', href: ROUTES.LANDING }, { label: 'Sitemap' }]}
          className="mb-6"
        />

        <h1 className="font-editorial text-title-xl text-[var(--color-text)] text-balance">
          Sitemap
        </h1>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-shell">
          {/* Main pages */}
          <section>
            <h2 className="text-ui font-medium text-[var(--color-text)] mb-4">Pages</h2>
            <ul className="space-y-2">
              {[
                { label: 'Home',                 href: ROUTES.LANDING },
                { label: 'Explore',              href: ROUTES.EXPLORE },
                { label: 'About',                href: ROUTES.ABOUT },
                { label: 'Community guidelines', href: ROUTES.GUIDELINES },
                { label: 'Help',                 href: ROUTES.HELP },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-body text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Experience categories */}
          <section>
            <h2 className="text-ui font-medium text-[var(--color-text)] mb-4">Experiences</h2>
            <ul className="space-y-2">
              {EXPERIENCE_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={ROUTES.EXPLORE_CATEGORY(cat.slug)}
                    className="text-body text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {cat.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

import Link from 'next/link';
import { ROUTES } from '../../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import Logo from './Logo';

/**
 * Site-wide footer — present on every public page.
 * Required for SEO (FR-SEO-15): provides global internal linking structure.
 * Typography-only — no icons, no color, no heavy chrome.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  // Take the first 8 categories for the footer links
  const footerCategories = EXPERIENCE_CATEGORIES.slice(0, 8);

  return (
    <footer
      aria-label="Site footer"
      className="mt-20 border-t border-[var(--color-border)]"
    >
      <div className="content-column py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Logo href={ROUTES.LANDING} height={26} />
            <p className="mt-3 text-caption text-[var(--color-text-muted)] leading-relaxed max-w-[160px]">
              A human-experience network built around anonymity and meaningful connection.
            </p>
          </div>

          {/* Experiences column */}
          <div>
            <h3 className="text-ui font-medium text-[var(--color-text)] mb-3">
              Experiences
            </h3>
            <nav aria-label="Experience categories footer navigation">
              <ul className="space-y-2">
                {footerCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={ROUTES.EXPLORE_CATEGORY(cat.slug)}
                      className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {cat.displayName}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={ROUTES.EXPLORE}
                    className="text-caption text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                  >
                    All experiences →
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Platform column */}
          <div>
            <h3 className="text-ui font-medium text-[var(--color-text)] mb-3">
              Platform
            </h3>
            <nav aria-label="Platform links footer navigation">
              <ul className="space-y-2">
                <li>
                  <Link
                    href={ROUTES.ABOUT}
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.GUIDELINES}
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Community guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.HELP}
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Help
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.SITEMAP}
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Sitemap
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal column */}
          <div>
            <h3 className="text-ui font-medium text-[var(--color-text)] mb-3">
              Legal
            </h3>
            <nav aria-label="Legal links footer navigation">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-caption text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Terms of service
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-caption text-[var(--color-text-muted)]">
            © {year} AMONG. All rights reserved.
          </p>
          <p className="text-caption text-[var(--color-text-muted)]">
            Built for humans. For privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}

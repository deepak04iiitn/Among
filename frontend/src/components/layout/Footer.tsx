import Link from 'next/link';
import type { JSX, ReactNode } from 'react';
import { ROUTES } from '../../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import {
  FOOTER_COLOPHON_LINKS,
  FOOTER_COPY,
  footerCopyright,
} from '../../constants/footer';
import Logo from './Logo';
import { BRAND_LOGO } from '../../constants/brand';

/**
 * Site-wide footer — "Letter / Typesetter" pattern.
 * Full spec: /docs/theme.md §7 "Footer — Letter / Typesetter (locked pattern)".
 *
 * A letter closing (statement + logo lockup) with a P.S.
 * field of experience names — wrapping, not a single comma line.
 *
 * Present on every public page — the sole source of the global footer
 * (FR-SEO-15/16/17 internal linking). No page should hand-roll its own.
 */

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer aria-label={FOOTER_COPY.ARIA_LABEL} className="mt-24 border-t border-border">
      <div className="spread-column py-14 md:py-16">
        {/* ─── Letter ─── */}
        <p className="font-editorial italic text-title text-text text-pretty max-w-reading">
          {FOOTER_COPY.STATEMENT}
        </p>
        <Logo href={ROUTES.LANDING} height={BRAND_LOGO.FOOTER_HEIGHT_PX} className="mt-8" />

        {/* ─── P.S. — wrapping name field ─── */}
        <nav aria-labelledby="footer-ps-heading" className="mt-12">
          <p
            id="footer-ps-heading"
            className="flex items-center gap-2.5 text-caption italic text-text-muted"
          >
            {FOOTER_COPY.PS_HEADING}
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
            />
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-1 border-l-2 border-border pl-5">
            {EXPERIENCE_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <FooterLink href={ROUTES.EXPLORE_CATEGORY(cat.slug)}>
                  {cat.displayName}
                </FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─── Stamp ─── */}
        <div className="mt-10 flex flex-wrap items-center justify-end gap-x-5 gap-y-2 border-t border-border pt-4">
          <nav aria-label={FOOTER_COPY.COLOPHON_NAV}>
            <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1">
              {FOOTER_COLOPHON_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href} compact>
                    {label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-caption text-text-muted">{footerCopyright(year)}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  compact?: boolean;
}): JSX.Element {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center text-text-secondary hover:text-text',
        'transition-colors duration-fast rounded-sm',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        compact ? 'min-h-11 text-caption' : 'min-h-11 font-editorial italic text-body',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

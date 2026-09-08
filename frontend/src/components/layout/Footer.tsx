import Link from 'next/link';
import type { JSX, ReactNode } from 'react';
import { ROUTES } from '../../constants/routes';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import {
  FOOTER_COPY,
  FOOTER_LEGAL_LINKS,
  FOOTER_PLATFORM_LINKS,
  footerCopyright,
} from '../../constants/footer';
import { BRAND_LOGO } from '../../constants/brand';
import { ANIMATION, COLOR, FONT, RADIUS, TEXT_SIZE } from '../../constants/design';
import Logo from './Logo';

/**
 * Site-wide footer — full-width endpaper band.
 *
 * Edge-to-edge warm linen wash (`bg-bg-subtle`) separates the footer from cream
 * page content without a dark slab. Rose hairline, editorial close, three-column
 * index, baseline bar with CTA.
 *
 * Present on every public page — the sole source of the global footer
 * (FR-SEO-15/16/17 internal linking). No page should hand-roll its own.
 */

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label={FOOTER_COPY.ARIA_LABEL}
      className={[
        'mt-24 md:mt-32 w-full',
        COLOR.BG_SUBTLE,
        'border-t',
        COLOR.BORDER_STRONG,
      ].join(' ')}
    >
      <span className="block h-px bg-accent max-w-spread mx-auto" aria-hidden="true" />

      <div className="spread-column py-14 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] gap-10 lg:gap-16 items-start">
          <Logo href={ROUTES.LANDING} height={BRAND_LOGO.FOOTER_HEIGHT_PX} />

          <div>
            <p className="flex items-center gap-2.5 text-caption font-ui uppercase tracking-[0.16em] text-text-muted mb-6">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              {FOOTER_COPY.KICKER}
            </p>
            <p
              className={[
                FONT.EDITORIAL,
                'italic',
                TEXT_SIZE.TITLE_XL,
                'md:text-headline',
                COLOR.TEXT,
                'text-pretty leading-[1.05] max-w-reading',
              ].join(' ')}
            >
              {FOOTER_COPY.STATEMENT}
            </p>
          </div>
        </div>

        <span
          className={`${ANIMATION.LANDING_RULE} mt-12 md:mt-16 max-w-spread`}
          aria-hidden="true"
        />

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-x-10 lg:gap-x-14">
          <FooterColumn
            navLabel={FOOTER_COPY.PLATFORM_NAV}
            heading={FOOTER_COPY.PLATFORM_HEADING}
            className="md:col-span-3"
          >
            <ul className="space-y-1">
              {FOOTER_PLATFORM_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href} prominent>
                    {label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn
            navLabel={FOOTER_COPY.ROOMS_NAV}
            heading={FOOTER_COPY.ROOMS_HEADING}
            className="md:col-span-6"
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-x-6 gap-y-1">
              {EXPERIENCE_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <FooterLink href={ROUTES.EXPLORE_CATEGORY(cat.slug)}>
                    {cat.displayName}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn
            navLabel={FOOTER_COPY.LEGAL_NAV}
            heading={FOOTER_COPY.LEGAL_HEADING}
            className="md:col-span-3"
          >
            <ul className="space-y-1">
              {FOOTER_LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>
        </div>

        <div
          className={[
            'mt-12 md:mt-14 pt-8 border-t',
            COLOR.BORDER,
            'flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between',
          ].join(' ')}
        >
          <p className={`text-caption ${COLOR.TEXT_MUTED}`}>
            {footerCopyright(year)}
          </p>

          <Link
            href={ROUTES.LANDING}
            aria-label={FOOTER_COPY.CTA_ARIA}
            className={[
              'inline-flex items-center justify-center',
              'min-h-11 px-6 py-2.5',
              RADIUS.PILL,
              COLOR.BG_TEXT,
              'text-bg text-ui font-ui',
              'hover:opacity-90',
              'transition-opacity duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            ].join(' ')}
          >
            {FOOTER_COPY.CTA}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  navLabel,
  heading,
  className = '',
  children,
}: {
  navLabel: string;
  heading: string;
  className?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <nav aria-label={navLabel} className={className}>
      <p className={`text-caption font-ui uppercase tracking-[0.14em] ${COLOR.TEXT_MUTED} mb-5`}>
        {heading}
      </p>
      {children}
    </nav>
  );
}

function FooterLink({
  href,
  children,
  prominent = false,
}: {
  href: string;
  children: ReactNode;
  prominent?: boolean;
}): JSX.Element {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center min-h-11',
        'text-text-secondary hover:text-text',
        'transition-colors duration-fast rounded-sm',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        prominent
          ? `${FONT.EDITORIAL} italic ${TEXT_SIZE.BODY}`
          : `font-ui ${TEXT_SIZE.UI}`,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

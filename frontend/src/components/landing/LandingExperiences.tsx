import type { JSX } from 'react';
import Link from 'next/link';
import { EXPERIENCE_CATEGORIES } from '../../constants/experienceCategories';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { ROUTES } from '../../constants/routes';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

function tocIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export default function LandingExperiences(): JSX.Element {
  return (
    <LandingSection id="experiences" ariaLabel={LANDING.EXPERIENCES_REGION}>
      <div className="max-w-spread mx-auto">
        <InView>
        <div className="max-w-reading mb-12 md:mb-16">
          <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-4">
            {LANDING.EXPERIENCES_KICKER}
          </p>
          <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-4`}>
            {LANDING.EXPERIENCES_HEADING}
          </h2>
          <p className="text-body text-text-secondary text-pretty">
            {LANDING.EXPERIENCES_LEDE}
          </p>
        </div>
        </InView>

        <InView>
        <ul>
          {EXPERIENCE_CATEGORIES.map((category, index) => (
            <li key={category.id}>
              <Link
                href={ROUTES.EXPLORE_CATEGORY(category.slug)}
                className={`${ANIMATION.LANDING_TOC} group grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_minmax(0,0.42fr)_minmax(0,0.58fr)] gap-x-4 md:gap-x-8 py-5 md:py-6 min-h-[44px] items-baseline
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4`}
                aria-label={`Explore anonymous ${category.displayName} experiences`}
              >
                <span
                  aria-hidden="true"
                  className="text-caption text-text-muted font-ui tabular-nums pt-1 group-hover:text-accent transition-colors duration-[var(--duration-fast)]"
                >
                  {tocIndex(index)}
                </span>
                <span
                  className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} text-text-secondary group-hover:text-text transition-colors duration-[var(--duration-fast)]`}
                >
                  {category.displayName}
                </span>
                <span className="col-start-2 md:col-start-3 text-ui text-text-muted group-hover:text-text-secondary transition-colors duration-[var(--duration-fast)]">
                  {category.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        </InView>

        <InView>
        <p className="mt-10">
          <Link
            href={LANDING_LINKS.EXPLORE}
            className={`${ANIMATION.LANDING_LINK} text-ui text-accent`}
            aria-label={LANDING.EXPERIENCES_ALL_ARIA}
          >
            {LANDING.EXPERIENCES_ALL}
          </Link>
        </p>
        </InView>
      </div>
    </LandingSection>
  );
}

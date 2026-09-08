import type { JSX } from 'react';
import Link from 'next/link';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

function clauseIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export default function LandingSafety(): JSX.Element {
  return (
    <LandingSection id="safety" ariaLabel={LANDING.SAFETY_REGION}>
      <div className="max-w-spread mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-20 items-start">
          <div className="lg:sticky lg:top-28">
            <InView>
            <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-4">
              {LANDING.SAFETY_KICKER}
            </p>
            <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-5`}>
              {LANDING.SAFETY_HEADING}
            </h2>
            <p className="text-body text-text-secondary text-pretty">
              {LANDING.SAFETY_LEDE}
            </p>
            <div className="mt-8 flex flex-col items-start gap-2">
              <Link
                href={LANDING_LINKS.GUIDELINES}
                className={`${ANIMATION.LANDING_LINK} text-ui text-text`}
              >
                {LANDING.SAFETY_GUIDELINES}
              </Link>
              <Link
                href={LANDING_LINKS.HELP}
                className={`${ANIMATION.LANDING_LINK} text-ui text-text-muted`}
              >
                {LANDING.SAFETY_HELP}
              </Link>
            </div>
            </InView>
          </div>

          <ol>
            {LANDING.SAFETY_POINTS.map((point, index) => (
              <li key={point.title} className="border-t border-border py-8 first:border-t-0 first:pt-0">
                <InView>
                  <h3 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE} text-text flex gap-4 items-baseline`}>
                    <span className="text-caption text-text-muted font-ui tabular-nums" aria-hidden="true">
                      {clauseIndex(index)}
                    </span>
                    {point.title}
                  </h3>
                  <p className="mt-3 pl-9 md:pl-10 text-body text-text-secondary text-pretty">
                    {point.body}
                  </p>
                </InView>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </LandingSection>
  );
}

import type { JSX } from 'react';
import Link from 'next/link';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

export default function LandingManifesto(): JSX.Element {
  const [first, ...rest] = LANDING.MANIFESTO_PARAGRAPHS;

  return (
    <LandingSection id="what-this-is" ariaLabel={LANDING.MANIFESTO_REGION}>
      <InView>
      <div className="max-w-spread mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-5">
              {LANDING.MANIFESTO_KICKER}
            </p>
            <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-10`}>
              {LANDING.MANIFESTO_HEADING}
            </h2>
            <blockquote className="relative pl-6 md:pl-8">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"
              />
              <p className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} md:text-title-xl text-text text-pretty`}>
                {LANDING.MANIFESTO_PULL}
              </p>
            </blockquote>
          </div>

          <div>
            <span className={ANIMATION.LANDING_RULE} aria-hidden="true" />
            <div className="mt-8 space-y-6">
              {first !== undefined && (
                <p className={`${ANIMATION.LANDING_DROP} text-body text-text-secondary text-pretty`}>
                  {first}
                </p>
              )}
              {rest.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-body text-text-secondary text-pretty">
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="mt-10">
              <Link
                href={LANDING_LINKS.ABOUT}
                className={`${ANIMATION.LANDING_LINK} text-ui text-text`}
              >
                {LANDING.MANIFESTO_ABOUT}
              </Link>
            </p>
          </div>
        </div>
      </div>
      </InView>
    </LandingSection>
  );
}

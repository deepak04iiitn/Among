import type { JSX } from 'react';
import { LANDING } from '../../constants/landing';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

const FOLIO_DELAY = [
  undefined,
  ANIMATION.HOW_DELAY_2,
  ANIMATION.HOW_DELAY_3,
] as const;

/**
 * How it works — three folio openings.
 * Grid lives on the component (Tailwind) so the verso/recto split cannot
 * be flattened by nested @layer media queries.
 */
export default function LandingHowItWorks(): JSX.Element {
  return (
    <LandingSection id="how-it-works" ariaLabel={LANDING.HOW_REGION}>
      <div className="max-w-spread mx-auto w-full">
        <InView>
          <div className="max-w-reading mb-8 md:mb-12">
            <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-4">
              {LANDING.HOW_KICKER}
            </p>
            <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-4`}>
              {LANDING.HOW_HEADING}
            </h2>
            <p className="text-body text-text-secondary text-pretty">
              {LANDING.HOW_LEDE}
            </p>
          </div>
        </InView>

        {LANDING.HOW_STEPS.map((step, index) => {
          const delayClass = FOLIO_DELAY[index];
          return (
            <InView key={step.cue} className={delayClass}>
              <article
                className={[
                  ANIMATION.HOW_FOLIO,
                  'w-full border-t border-border',
                  'grid grid-cols-1 md:grid-cols-[minmax(0,0.42fr)_1px_minmax(0,0.58fr)]',
                  'gap-6 md:gap-x-12 lg:gap-x-16',
                  'py-12 md:py-16 lg:py-20',
                  'md:min-h-[22rem]',
                ].join(' ')}
                aria-labelledby={`how-title-${step.numeral}`}
              >
                <div className={`${ANIMATION.HOW_VERSO} min-w-0 flex flex-col justify-center`}>
                  <p className="text-caption text-text-muted font-ui uppercase tracking-[0.18em] mb-5">
                    {step.numeral}
                  </p>
                  <p className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline lg:text-display text-text leading-[0.95] text-balance`}>
                    {step.cue}
                  </p>
                  <span className={ANIMATION.HOW_VERSO_MARK} aria-hidden="true" />
                </div>

                <span
                  className={`${ANIMATION.HOW_GUTTER} hidden md:block w-px bg-border self-stretch origin-top`}
                  aria-hidden="true"
                />

                <div className={`${ANIMATION.HOW_RECTO} min-w-0 flex flex-col justify-center`}>
                  <h3
                    id={`how-title-${step.numeral}`}
                    className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE} md:text-title-xl text-text text-balance mb-5`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-body text-text-secondary text-pretty max-w-reading">
                    {step.body}
                  </p>
                  {step.sameMark && (
                    <p className="mt-8" aria-hidden="true">
                      <span className="reaction-btn pointer-events-none" aria-pressed="true">
                        {LANDING.HOW_SAME_MARK}
                      </span>
                    </p>
                  )}
                </div>
              </article>
            </InView>
          );
        })}
      </div>
    </LandingSection>
  );
}

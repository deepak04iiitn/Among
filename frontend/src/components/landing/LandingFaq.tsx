import type { JSX } from 'react';
import Link from 'next/link';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

export default function LandingFaq(): JSX.Element {
  return (
    <LandingSection id="questions" ariaLabel={LANDING.FAQ_REGION}>
      <InView>
      <div className="max-w-shell mx-auto">
        <div className="max-w-reading mb-10 md:mb-14">
          <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-4">
            {LANDING.FAQ_KICKER}
          </p>
          <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance`}>
            {LANDING.FAQ_HEADING}
          </h2>
        </div>

        <div className={`${ANIMATION.LANDING_FAQ} border-t border-border`}>
          {LANDING.FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group border-b border-border">
              <summary className="flex items-start justify-between gap-6 py-6 md:py-7 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4">
                <h3 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE} text-text text-balance pr-4 cursor-pointer`}>
                  {item.question}
                </h3>
                <span
                  aria-hidden="true"
                  className="landing-faq-mark mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text-muted text-body leading-none cursor-pointer"
                >
                  +
                </span>
              </summary>
              <p className="pb-7 pr-12 md:pr-16 text-body text-text-secondary text-pretty max-w-reading">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-10">
          <Link
            href={LANDING_LINKS.HELP}
            className={`${ANIMATION.LANDING_LINK} text-ui text-text cursor-pointer`}
          >
            {LANDING.FAQ_MORE}
          </Link>
        </p>
      </div>
      </InView>
    </LandingSection>
  );
}

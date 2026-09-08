import type { JSX } from 'react';
import Link from 'next/link';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

export default function LandingClose(): JSX.Element {
  return (
    <LandingSection
      id="begin"
      ariaLabel={LANDING.CLOSE_REGION}
      className="bg-bg-subtle text-center"
    >
      <InView>
      <div className="max-w-reading mx-auto py-8 md:py-12">
        <h2 className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-6`}>
          {LANDING.CLOSE_HEADING}
        </h2>
        <p className="text-body-lg text-text-secondary text-pretty mb-10">
          {LANDING.CLOSE_LEDE}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href={LANDING_LINKS.PRIMARY_CTA}
            className="btn-primary text-body px-8 py-3.5"
            aria-label={LANDING.CTA_PRIMARY_ARIA}
          >
            {LANDING.CTA_PRIMARY}
          </Link>
          <Link
            href={LANDING_LINKS.EXPLORE}
            className="text-ui text-text-secondary hover:text-text transition-colors min-h-[44px] inline-flex items-center"
            aria-label={LANDING.CTA_SECONDARY_ARIA}
          >
            {LANDING.CTA_SECONDARY}
          </Link>
        </div>
      </div>
      </InView>
    </LandingSection>
  );
}

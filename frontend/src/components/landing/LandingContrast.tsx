import type { JSX } from 'react';
import { LANDING } from '../../constants/landing';
import { FONT, TEXT_SIZE } from '../../constants/design';
import LandingSection from './LandingSection';
import InView from './InView';

export default function LandingContrast(): JSX.Element {
  return (
    <LandingSection id="not-this" ariaLabel={LANDING.CONTRAST_REGION}>
      <div className="max-w-spread mx-auto">
        <InView>
        <div className="max-w-reading mb-12 md:mb-16">
          <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-4">
            {LANDING.CONTRAST_KICKER}
          </p>
          <h2 className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance`}>
            {LANDING.CONTRAST_HEADING}
          </h2>
        </div>
        </InView>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          {LANDING.CONTRAST_ITEMS.map((item) => (
            <li key={item.label} className="border-t border-border py-8 md:py-10">
              <InView>
                <p className="text-caption text-text-muted font-ui uppercase tracking-[0.12em] mb-3">
                  {LANDING.CONTRAST_INSTEAD}
                </p>
                <h3 className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} text-text-muted text-balance mb-4`}>
                  <span className="line-through decoration-border-strong decoration-1">
                    {item.struck}
                  </span>
                </h3>
                <p className="text-body text-text-secondary max-w-reading text-pretty">
                  {item.body}
                </p>
              </InView>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}

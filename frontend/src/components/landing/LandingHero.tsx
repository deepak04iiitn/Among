import type { JSX } from 'react';
import Link from 'next/link';
import { LANDING, LANDING_LINKS } from '../../constants/landing';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';

export default function LandingHero(): JSX.Element {
  return (
    <section
      aria-label={LANDING.HERO_REGION}
      className="flex flex-col items-center justify-start text-center px-6 pt-16 md:pt-20 pb-16 md:pb-20"
    >
      <p
        className={[
          ANIMATION.HERO_KICKER,
          'flex items-center justify-center gap-2.5',
          'text-caption text-text-muted font-ui uppercase tracking-[0.15em] mb-8',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
        />
        {LANDING.HERO_KICKER}
      </p>

      <h1
        className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-display text-text text-balance mb-8`}
        aria-label={LANDING.HERO_TITLE}
      >
        {LANDING.HERO_WORDS.map((word, i) => (
          <span key={`${word}-${String(i)}`} className="word-reveal" aria-hidden="true">
            <span>{word}</span>
            {i < LANDING.HERO_WORDS.length - 1 && '\u00A0'}
          </span>
        ))}
      </h1>

      <p
        className={`${ANIMATION.HERO_LEDE} text-body-lg text-text-secondary max-w-reading text-pretty mb-12`}
      >
        {LANDING.HERO_LEDE}
      </p>

      <div
        className={`${ANIMATION.HERO_ACTIONS} flex flex-col sm:flex-row items-center gap-5`}
      >
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
    </section>
  );
}

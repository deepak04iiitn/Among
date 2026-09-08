import type { JSX } from 'react';
import Link from 'next/link';
import { ROUTES } from '../../constants/routes';
import {
  EXPLORE,
  EXPLORE_DOMAINS,
  EXPLORE_MORE,
  exploreChapterHref,
  exploreChapterId,
  roomsForDomain,
} from '../../constants/explore';
import { ANIMATION, FONT, TEXT_SIZE } from '../../constants/design';
import InView from '../landing/InView';

const CHAPTER_DELAY = [
  undefined,
  ANIMATION.HOW_DELAY_2,
  ANIMATION.HOW_DELAY_3,
] as const;

/**
 * Explore — three life-domain folios.
 * Verso: the chapter. Recto: the rooms in that life.
 */
export default function ExploreIndex(): JSX.Element {
  return (
    <section aria-label={EXPLORE.REGION} className="px-5 md:px-8 py-16 md:py-24">
      <div className="max-w-spread mx-auto w-full">
        <InView>
          <header className="pb-16 md:pb-24">
            <p className="flex items-center gap-2.5 text-caption text-text-muted font-ui uppercase tracking-[0.16em] mb-8">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              {EXPLORE.KICKER}
            </p>
            <h1 className={`${FONT.EDITORIAL} ${TEXT_SIZE.HEADLINE} md:text-display text-text text-balance leading-[0.95] mb-10`}>
              {EXPLORE.HEADING}
            </h1>
            <span className={`${ANIMATION.LANDING_RULE} max-w-reading`} aria-hidden="true" />
            <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] gap-10 md:gap-16 items-start">
              <p className={`${ANIMATION.LANDING_DROP} text-body-lg text-text-secondary text-pretty max-w-reading`}>
                {EXPLORE.LEDE}
              </p>
              <nav aria-label={EXPLORE.CONTENTS_ARIA}>
                <p className="text-caption text-text-muted font-ui uppercase tracking-[0.14em] mb-5">
                  {EXPLORE.CONTENTS_KICKER}
                </p>
                <ul>
                  {EXPLORE_DOMAINS.map((domain) => (
                    <li key={domain.id}>
                      <a
                        href={exploreChapterHref(domain.id)}
                        aria-label={EXPLORE.CONTENTS_ITEM_ARIA(domain.numeral, domain.title)}
                        className="group flex items-baseline gap-4 min-h-[44px] py-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
                      >
                        <span className="text-caption text-text-muted font-ui tabular-nums tracking-[0.12em] group-hover:text-accent transition-colors duration-fast">
                          {domain.numeral}
                        </span>
                        <span className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} text-text-secondary group-hover:text-text transition-colors duration-fast`}>
                          {domain.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>
        </InView>

        {EXPLORE_DOMAINS.map((domain, index) => {
          const rooms = roomsForDomain(domain.categoryIds);
          const delayClass = CHAPTER_DELAY[index];
          const headingId = exploreChapterId(domain.id);

          return (
            <InView key={domain.id} className={delayClass}>
              <article
                className={[
                  ANIMATION.HOW_FOLIO,
                  'w-full border-t border-border',
                  'grid grid-cols-1 md:grid-cols-[minmax(0,0.42fr)_1px_minmax(0,0.58fr)]',
                  'gap-6 md:gap-x-12 lg:gap-x-16',
                  'py-12 md:py-16 lg:py-20',
                  'md:min-h-[22rem]',
                ].join(' ')}
                aria-labelledby={headingId}
              >
                <div className={`${ANIMATION.HOW_VERSO} min-w-0 flex flex-col justify-center`}>
                  <p className="text-caption text-text-muted font-ui uppercase tracking-[0.18em] mb-5">
                    {domain.numeral}
                  </p>
                  <h2
                    id={headingId}
                    className={`${FONT.EDITORIAL} ${TEXT_SIZE.TITLE_XL} md:text-headline lg:text-display text-text leading-[0.95] text-balance`}
                  >
                    {domain.title}
                  </h2>
                  <span className={ANIMATION.HOW_VERSO_MARK} aria-hidden="true" />
                </div>

                <span
                  className={`${ANIMATION.HOW_GUTTER} hidden md:block w-px bg-border self-stretch origin-top`}
                  aria-hidden="true"
                />

                <div className={`${ANIMATION.HOW_RECTO} min-w-0 flex flex-col justify-center`}>
                  <ul aria-label={EXPLORE.CHAPTER_ARIA(domain.title)}>
                    {rooms.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={ROUTES.EXPLORE_CATEGORY(category.slug)}
                          aria-label={EXPLORE.ROOM_ARIA(category.displayName)}
                          className={`${ANIMATION.LANDING_TOC} group flex flex-col gap-1 py-4 md:py-5 min-h-[44px] cursor-pointer
                                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4`}
                        >
                          <span className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} text-text-secondary group-hover:text-text transition-colors duration-fast`}>
                            {category.displayName}
                          </span>
                          <span className="text-ui text-text-muted group-hover:text-text-secondary transition-colors duration-fast text-pretty">
                            {category.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </InView>
          );
        })}

        <InView>
          <div className="border-t border-border pt-16 md:pt-24 pb-4">
            <p className="flex items-center gap-2.5 text-caption text-text-muted font-ui uppercase tracking-[0.16em] mb-6">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              {EXPLORE.MORE_KICKER}
            </p>
            <h2 className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE_XL} md:text-headline text-text text-balance mb-8`}>
              {EXPLORE.MORE_HEADING}
            </h2>
            <span className={`${ANIMATION.LANDING_RULE} max-w-reading`} aria-hidden="true" />
            <nav aria-label={EXPLORE.MORE_ARIA} className="mt-12 md:mt-16">
              <ul className="grid grid-cols-1 md:grid-cols-3">
                {EXPLORE_MORE.map((item) => (
                  <li
                    key={item.href}
                    className="border-t border-border md:border-t-0 md:border-l md:border-border first:border-t-0 md:first:border-l-0 md:px-8 md:first:pl-0 md:last:pr-0"
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className="group flex flex-col gap-3 min-h-[44px] py-8 md:py-1 cursor-pointer
                                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
                    >
                      <span className={`${FONT.EDITORIAL} italic ${TEXT_SIZE.TITLE} text-text group-hover:text-accent transition-colors duration-fast`}>
                        {item.label}
                      </span>
                      <span className="text-ui text-text-muted text-pretty group-hover:text-text-secondary transition-colors duration-fast">
                        {item.line}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </InView>
      </div>
    </section>
  );
}
